const pdfjsLib = require("pdfjs-dist/build/pdf.js");
const path = require("path");

pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(
  "node_modules/pdfjs-dist/build/pdf.worker.js",
);

const standardFontDataUrl =
  "https://www.mercosur.int/wp-content/plugins/wpdm-pdf-viewer/pdfjs/web/standard_fonts/";

async function getTextContentFromPage(pdfDocument, pageIndex) {
  const pdfPage = await pdfDocument.getPage(pageIndex + 1);

  const textContent = await pdfPage.getTextContent();

  // Helper function to determine the width of a text item
  function calculateWidth(item) {
    const [scaleX] = item.transform;
    return (item.width || item.str.length * 10) * scaleX; // Adjust based on transformation matrix
  }

  // Helper function to determine if two text items should be merged
  function shouldMerge(item1, item2) {
    const spaceThreshold = 5; // Adjust this threshold as needed
    const deltaX =
      item2.transform[4] - (item1.transform[4] + item1.calculatedWidth);
    const deltaY = Math.abs(item2.transform[5] - item1.transform[5]);

    // Check if items are on the same line and close enough to be considered part of the same word
    return deltaX < spaceThreshold && deltaY < 10;
  }

  // Helper function to determine if an item starts a new line
  function isNewLine(item1, item2) {
    const lineThreshold = 10; // Adjust this threshold as needed
    return Math.abs(item2.transform[5] - item1.transform[5]) > lineThreshold;
  }

  // Merge text items, taking into account line breaks
  const mergedTextItems = { items: [] };

  textContent.items.forEach((item, index, array) => {
    item.calculatedWidth = calculateWidth(item); // Calculate and store the width for the item

    if (index > 0) {
      if (isNewLine(array[index - 1], item)) {
        mergedTextItems.items.push({ ...item });
      } else if (shouldMerge(array[index - 1], item)) {
        const lastItem =
          mergedTextItems.items[mergedTextItems.items.length - 1];
        lastItem.str += item.str;
        lastItem.calculatedWidth += item.calculatedWidth; // Sum the widths
      } else {
        mergedTextItems.items.push({ ...item });
      }
    } else {
      mergedTextItems.items.push({ ...item });
    }
  });

  // Remove the temporary calculatedWidth property from the final output
  mergedTextItems.items.forEach((item) => {
    item.width = item.calculatedWidth;
    delete item.calculatedWidth;
  });

  return mergedTextItems;
}

async function getTimesDetected(textContent, searchString) {
  let num = 0;
  const searchStringLength = searchString.length;
  let buffer = "";

  for (let i = 0; i < textContent.items.length; i++) {
    const item = textContent.items[i];
    buffer += item.str;

    // Maintain the buffer to be at most the length of searchString
    if (buffer.length > searchStringLength) {
      buffer = buffer.slice(buffer.length - searchStringLength);
    }

    // Check if the searchString is in the buffer
    if (buffer.includes(searchString)) {
      num++;
    }
  }

  return num;
}

async function isNameFollowedByTitle(
  textContent,
  searchString,
  occurrence,
  titlesToCheck,
) {
  const searchStringLength = searchString.length;
  let buffer = "";
  let occurrenceCount = 0;
  let followedByTitle = false;

  for (let i = 0; i < textContent.items.length; i++) {
    const item = textContent.items[i];
    buffer += item.str;

    // Maintain the buffer to be at most the length of searchString
    if (buffer.length > searchStringLength && !followedByTitle) {
      buffer = buffer.slice(buffer.length - searchStringLength);
    }

    // Check if the searchString is in the buffer
    if (buffer.includes(searchString)) {
      occurrenceCount++;

      if (occurrenceCount === occurrence) {
        // Find the next actual word after the name
        let nextWord = null;
        let nextIndex = i + 1;
        while (!nextWord && nextIndex < textContent.items.length) {
          const nextItem = textContent.items[nextIndex]?.str;
          if (nextItem && nextItem.trim() !== "") {
            nextWord = nextItem.split(/[\s-]+/)[0];
          }
          nextIndex++;
        }

        if (nextWord) {
          // Check if a next word was found
          for (const title of titlesToCheck) {
            if (nextWord === title) {
              followedByTitle = true;
              break;
            }
          }
        }
      }
    }
  }

  return followedByTitle;
}

async function findTextPosition(textContent, searchString, occurrence) {
  let x = null;
  let y = null;
  let nameWidth = 0;
  const searchStringLength = searchString.length;
  let buffer = "";
  let occurrenceCount = 0;
  let startIndex = -1;

  for (let i = 0; i < textContent.items.length; i++) {
    const item = textContent.items[i];
    buffer += item.str;

    // Maintain the buffer to be at most the length of searchString
    if (buffer.length > searchStringLength) {
      buffer = buffer.slice(buffer.length - searchStringLength);
    }

    // Check if the searchString is in the buffer
    if (buffer.includes(searchString)) {
      occurrenceCount++;
      if (occurrenceCount === occurrence) {
        x = item.transform[4];
        y = item.transform[5];
        startIndex = i;
      }
    }
  }

  // Calculate the width of the search string
  if (startIndex !== -1) {
    for (let i = startIndex; i < textContent.items.length; i++) {
      const item = textContent.items[i];

      nameWidth += item.width;

      if (item.str.includes(searchString[searchString.length - 1])) {
        break;
      }
    }
  }

  return { x, y, nameWidth };
}

async function calculateCenteredX(pageWidth, positionX, nameWidth, signWidth) {
  // Calculate the center point of the user's name
  const nameCenterX = positionX + nameWidth / 2;

  // Calculate the starting X position to center the signature
  // The signature should start at: nameCenterX - (signWidth / 2)
  const signatureStartX = nameCenterX - (signWidth / 2) * 0.1;

  return signatureStartX;
}

module.exports = {
  pdfjsLib,
  standardFontDataUrl,
  getTextContentFromPage,
  getTimesDetected,
  isNameFollowedByTitle,
  findTextPosition,
  calculateCenteredX,
};
