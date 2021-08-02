import React, { useState, useEffect } from "react";
import { getImagesFromPDF } from "react-mindee-js";

import dummyPDF from "pdf.pdf";

export default function Example() {
  const [index, setIndex] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    getImagesFromPDF(dummyPDF).then((images: string[]) => {
      setImages(images);
    });
  }, []);
  return (
    <div style={{ position: "relative" }}>
      <img src={images[index]} />
      <div
        style={{
          padding: 10,
          position: "absolute",
          width: 100,
          maxHeight: 500,
          overflowY: "auto",
          top: 0,
          left: 0
        }}
      >
        {images.map((image: string, key: number) => (
          <img
            alt="page"
            onClick={() => setIndex(key)}
            key={key}
            style={{
              width: "100%",
              height: 50,
              cursor: "pointer",
              border: "2px solid transparent",
              borderColor: key === index ? "red" : "transparent"
            }}
            src={image}
          />
        ))}
      </div>
    </div>
  );
}
