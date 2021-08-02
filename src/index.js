// works for NODE > v10
const pug = require('pug');
const path = require('path');
require('dotenv').config()
const fs = require("fs");
const axios = require('axios');
var FormData = require('form-data');
//formidable takes the form data and saves the file, and parameterises the fields into JSON
const formidable = require('formidable')
const express = require('express');
const { response } = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(
	express.urlencoded({
	  extended: true
	})
  )
  
  app.use(express.json())

var w9Token = process.env.w9Token;


// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
//set up pug as view engine
app.set('view engine','pug');
// https://expressjs.com/en/starter/basic-routing.html


app.get("/", (request, response) => {
    return response.render('index');
});


app.post("/", (request, response) => {

	//this sends in a form with an image
    //formidable reads the form, saves the image
	var form = new formidable.IncomingForm({maxFileSize : 2000 * 1024 * 1024}); //2 Gb
	
	form.parse(request, (err, fields, files) => {
		var errorMarginX = parseFloat(fields.xerrorrange);
		var errorMarginY = parseFloat(fields.yerrorrange);
		console.log("error ranges", errorMarginX+ "  " + errorMarginY);
		if (err) {
			console.error('Error', err);
			throw err;
		}
		var newImagePath;

		//uploaded image
		console.log("file");	
		console.log("files data", JSON.stringify(files.imageSource));
		var imageName = path.parse(files.imageSource.name).name +".pdf";
		var imagePath = files.imageSource.path;
		var imageType = files.imageSource.type;
		var imageSize = files.imageSource.size;
		
		//FORMIDIABLE USES A RANDOM NAME ON UPLOAD.  RENAME
		 newImagePath  =  path.join("public/w9s/", imageName);
		 imageForPage = path.join("w9s/", imageName);
		 console.log("newImagePath",newImagePath);
		

		//heroku did not like this approach
		/*
		 fs.rename(imagePath, newImagePath, function (err) {
			if (err) throw err;
			console.log('File uploaded and moved!');
			//FILE IS RENAMED
			//NOW UPLOAD IT TO MINDEE WITH THE MAKEREQUEST FUNCTION
			makeRequest(newImagePath);
		});
		*/
		var readStream=fs.createReadStream(imagePath);
		var writeStream=fs.createWriteStream(newImagePath);
		readStream.pipe(writeStream);
		readStream.on('end',function(){
		 fs.unlinkSync(imagePath);
		 console.log('File uploaded and moved!');
		 makeRequest(newImagePath);
		});
	 
	
	
		async function makeRequest(newImagePath) {
			console.log("newImagePath",newImagePath);

			let data = new FormData();
				//add the image that was uploaded	
				data.append('document', fs.createReadStream(newImagePath));
			
			//console.log("form data ", data);
			
 		   const config = {
  			 method: 'POST',
  			   url: 'https://api.mindee.net/v1/products/doug1/us_w9/v1/predict?annotations=true',
  			   headers: { 
  				   "Authorization":'Token afdd39a62c99f7adc8d5c87a1167438b',
  				   ...data.getHeaders()
 				  },
				  data
 			  }
			 // console.log("config" ,config);
			  try {
				  let apiResponse = await axios(config)
				  console.log(" api response", apiResponse.data);
				  var documentId = apiResponse.data.document.id;
				  console.log("documentId", documentId);
				  var prediction =  apiResponse.data.document.inference.prediction
				 
				  //prediction is the JSON
				  //predictionResponse is the stringified predictions
				  var predictionResponse = JSON.stringify(prediction);
				  var alternativePredictions = {};
				  var elipses = {};
				  console.log('predictionresponse',predictionResponse);
				  var keys = Object.keys(prediction);
				  console.log("keys", keys);

					for(i=0;i<keys.length;i++){
						
						var predictionValues = prediction[keys[i]].values;
						console.log(keys[i], predictionValues);
						minx = 1;
						maxx =0;
						miny = 1;
						maxy=0;
						var sumx=0;
						var sumy=0;
						for(k=0;k< predictionValues.length;k++){
							//get the center for each prediction
							//console.log("predictionValues", predictionValues[k]);
							center = getPolygonCenter(predictionValues[k].polygon);
							console.log("center", center);
							currentx = center[0];
							currenty = center[1];

							//find mins and max
							minx = Math.min(minx, currentx);
							maxx = Math.max(maxx, currentx);
							miny = Math.min(miny, currenty)
							maxy = Math.max(maxy, currenty);
							sumx += currentx;
							sumy += currenty;
						}
						avgx = sumx/k;
						avgy = sumy/k;
						deltax = maxx-minx;
						deltay= maxy-miny;
						console.log("min, avg max x", minx+" "+avgx+ " "+maxx +" delta "+ deltax);
						console.log("min, avg max y", miny+" "+avgy+ " "+maxy +" delta "+ deltay);

						//ok we can now define an ellipse around the predictions
						//a is the radius in x direction
						//b is readius in y
						//let's call a 1.5*deltax OR the horizontal error
						var a = Math.max((1.5*deltax), errorMarginX);
						var b = Math.max((1.5*deltay), errorMarginY);
					//	console.log("a + b, ", a+"  " +b);
						var tempEllipse={ 
								"x": avgx,
								"y": avgy,
								"a": a,
								"b": b
							}
						elipses[keys[i]] = tempEllipse;

				//		console.log("ellipse", tempEllipse);
						
						//we have the pred=ictons JSOn.. Now lets create the top X "fixes" JSOn
						// these are potential correct answers
						//candidates are in ocr.candidates.pages[<page_id>]keys[i]
						key = keys[i];
						pageId = prediction[key].page_id;
						var ocrAlternatives = apiResponse.data.document.ocr.candidates.pages[pageId][keys[i]];


						var possibleAlternatives=[];
						//console.log("ocr alts", ocrAlternatives);
						for(l=0;l<ocrAlternatives.length;l++){
							var alternativeCenter = getPolygonCenter(ocrAlternatives[l].polygon);
							//console.log("alternativeCenter", alternativeCenter);
							alternativex = alternativeCenter[0];
							alternativey = alternativeCenter[1];
							ellipse = ((alternativex - avgx))**2/a**2 + ((alternativey - avgy))**2/b**2;
							//console.log("ellipse", ellipse);
							if(ellipse<=1){
								//this point is in the ellipse
								possibleAlternatives.push(ocrAlternatives[l]);
							}
						}
					//	console.log("values inside ellipse " + key, possibleAlternatives);
						var alternatives = { "values": possibleAlternatives};

						//push this into the JSON of alternatives
						alternativePredictions[key] = alternatives;

					}
					//now we have all the alternatives
				//	console.log("alternativePredictions", JSON.stringify(alternativePredictions));
				//	console.log("elipses", JSON.stringify(elipses));
					return response.render('check', {documentId, alternativePredictions,prediction, imageForPage, elipses});
				  
			  } catch (error) {
 				  console.log(error)
 			  }

		  }
	
	 });
});
app.post("/annotate", (request, response) => {

    var labels= [];
	var labels = (request.body);
	console.log("labels", labels);
	var labelKeys = Object.keys(labels);
	console.log("labelKeys", labelKeys);

	//get doc Id
	annotationDocumentId = labels['documentId'];
	console.log("annotationDocumentId", annotationDocumentId);

	annotationLebel =[];
	//we skip the document ID so start the loop at index 1
	for(i=1;i<labelKeys.length;i++){
		var annotation = labels[labelKeys[i]];
		console.log("name", labelKeys[i]);
		console.log("annotation", annotation);
		//if there is just one item, the key is not in an array
		//if there are 2 values - there already an array of keys

		//for each label, I need a JSOn object with the pageId, name and array of keys
		if(Array.isArray(annotation)){

			var newLabel = {"page_id":"0", "feature":labelKeys[i], "selected": annotation};
			console.log(newLabel);
		}else{
			var selectedArray = [];
			selectedArray.push(annotation);
			var newLabel = {"page_id":"0", "feature":labelKeys[i], "selected": selectedArray};
			console.log(newLabel);
		}
		annotationLebel.push(newLabel);


	}
	console.log("annotationLebel", annotationLebel);
	var annotationJson = ({ "labels": annotationLebel});
	data =annotationJson;
	console.log("annotationJson", data);
	//now we have the labels to send to mindee, so DO IT
	const config = {
		method: 'POST',
		  url: 'https://api.mindee.net/v1/products/doug1/us_w9/documents/'+annotationDocumentId+'/annotations',
		  headers: { 
			  "Authorization":'Token afdd39a62c99f7adc8d5c87a1167438b',
			  "Content-type": "application/json"
			},
			data
		}
	console.log("config", config);
	makeAnnotation(config);
	async function makeAnnotation(config) {
		try {
			let annotationResponse = await axios(config)
			console.log(" annotationresponse", annotationResponse);
			var success = annotationResponse.data.api_request.status_code
			return response.render('success', {success});
			
		}catch (error) {
			console.log(error)
		}
	
	}

});





function getPolygonCenter(polygon){
	polygonUpperleft = polygon[0];
	polygonBottomRight= polygon[2];
	xCenter =  (polygonUpperleft[0] +polygonBottomRight[0])/2;
	yCenter = (polygonUpperleft[1] +polygonBottomRight[1])/2;
	//console.log(xCenter,yCenter);
	return [xCenter,yCenter];

}



// listen for requests :)
const listener = app.listen(process.env.PORT || 3004, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

