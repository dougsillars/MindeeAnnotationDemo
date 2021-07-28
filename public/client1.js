console.log(elipses);

//ok I have all the elipses
//draw them in the canvas
var width=540;
var height =700;



const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
ctx.lineWidth = 1;
// Draw the ellipse


//name
ctx.beginPath();
ctx.strokeStyle="red";
ctx.ellipse(elipses["name"].x*width, elipses["name"].y*height, elipses["name"].a*width, elipses["name"].b*height, 0, 0, 2 * Math.PI);
ctx.stroke();

//ssn
ctx.beginPath();
ctx.strokeStyle="green";
ctx.ellipse(elipses["ssn"].x*width, elipses["ssn"].y*height, elipses["ssn"].a*width, elipses["ssn"].b*height, 0, 0, 2 * Math.PI);
ctx.stroke();

//street_address
ctx.beginPath();
ctx.strokeStyle="blue";
ctx.ellipse(elipses["street_address"].x*width, elipses["street_address"].y*height, elipses["street_address"].a*width, elipses["street_address"].b*height, 0, 0, 2 * Math.PI);
ctx.stroke();

//city
ctx.beginPath();
ctx.strokeStyle="orange";
ctx.ellipse(elipses["city"].x*width, elipses["city"].y*height, elipses["city"].a*width, elipses["city"].b*height, 0, 0, 2 * Math.PI);
ctx.stroke();


//state
ctx.beginPath();
ctx.strokeStyle="state";ctx.ellipse(elipses["state"].x*width, elipses["state"].y*height, elipses["state"].a*width, elipses["ssn"].b*height, 0, 0, 2 * Math.PI);
ctx.stroke();

//zip_code
ctx.beginPath();
ctx.strokeStyle="black";
ctx.ellipse(elipses["zip_code"].x*width, elipses["zip_code"].y*height, elipses["zip_code"].a*width, elipses["zip_code"].b*height, 0, 0, 2 * Math.PI);
ctx.stroke();

for (var key in elipses) {
        console.log(key + " -> " + elipses[key].x*width +"  "+ elipses[key].y*height);
        console.log(key + " -> " + elipses[key].a*width +"  "+ elipses[key].b*height);


    }


//drawEllipse(ctx, 10, 10, 100, 60);