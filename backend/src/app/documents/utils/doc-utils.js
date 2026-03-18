const docuDao = require("../daos/documents-dao");

const generateLPSNo = async () => {
  const lastDocument = await docuDao.getLastDocument();

  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const year = String(currentDate.getFullYear()).slice(-2);
  const formattedDate = `${month}${day}${year}`;

  let newlpsNo;

  if (lastDocument && lastDocument.lpsNo.startsWith(formattedDate)) {
    const lastIncrement = parseInt(lastDocument.lpsNo.split("-")[1], 10);
    const newIncrement = (lastIncrement % 500) + 1;
    newlpsNo = `${formattedDate}-${String(newIncrement).padStart(3, "0")}`;
  } else {
    newlpsNo = `${formattedDate}-001`;
  }

  return newlpsNo;
};

async function updateDocument(docuId, data) {
  try {
    const oldDocDetails = await docuDao.getDocumentById(docuId);

    const oldLastSource = oldDocDetails.lastSource;

    let newLastSource = [...oldDocDetails.lastSource];

    if (oldLastSource.length === 1) {
      newLastSource.push(data?.lastSource);
    } else {
      newLastSource = newLastSource.slice(1);

      newLastSource.push(data?.lastSource);
    }

    const updateObject = {
      ...data,
      ...(data.lastSource && { lastSource: newLastSource }),
    };

    const updatedDocument = await docuDao.updateDocument(docuId, updateObject);

    return updatedDocument;
  } catch (error) {
    console.error("Utils: Error updating document", error);
    throw error;
  }
}

module.exports = {
  generateLPSNo,
  updateDocument,
};
