// Mount sub-routers gawa ni Shaun
//docu  mentsRouter.put("/signWithCoordinates/:id", async (req, res) => {
//try {
//   const docuId = parseInt(req.params.id, 10);
//  const signedFile = await docuService.signWithCoordinates(docuId, req.body);
//   res.status(200).json(signedFile);
// } catch (error) {
//   console.log(error);
//   const statusCode = error.statusCode || 500;
//   const errorMessage = error.message || "Internal server error";
//  res.status(statusCode).json({ error: errorMessage });
// }
//});
// New endpoint for custom signature positioning
    // console.log(otherDetails);
    // console.log(error);
// documentsRouter.get("/documentsCount", async (req, res) => {
//   try {
//     const { auth } = req.query;
//     const documentsCount = await docuService.getDocumentsCount({
//       ...auth,
//       id: parseInt(auth.id, 10),
//     });
//     res.json(documentsCount);
//   } catch (error) {
//     console.error("Error fetching document count:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// documentsRouter.get("/allDocumentsCount", async (req, res) => {
//   try {
//     // const totalDocuments = await prisma.documents.count();
//     const allDocumentsCount = await docuService.getAllDocumentsCount();
//     res.json(allDocumentsCount);
//   } catch (error) {
//     console.error("Error fetching document count:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// documentsRouter.get("/allAdminDetailsCount", async (req, res) => {
//   try {
//     const allAdminsCount = await docuService.allAdminDetailsCount();
//     res.json(allAdminsCount);
//   } catch (error) {
//     console.error("Error fetching document count:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// documentsRouter.put("/reviseDocument/:id", uploadFile, async (req, res) => {
//   try {
//     const docuId = parseInt(req.params.id, 10);
//     let data = {};
//     for (const [key, value] of Object.entries(req.body)) {
//       if (value) {
//         if (
//           key === "isReadable" ||
//           key === "status" ||
//           key === "complexity" ||
//           key === "classification" ||
//           key === "acceptStatus"
//         ) {
//           data[key] = parseInt(value, 10);
//         } else if (
//           key === "action" ||
//           key === "primarySources" ||
//           key === "lastSource" ||
//           key === "destinations" ||
//           key === "annotation" ||
//           key === "uploadedBy" ||
//           key === "currentOwner"
//         ) {
//           data[key] = JSON.parse(value);
//         } else if (key === "changeFileOnly") {
//           data[key] = value === "1" ? true : false;
//         } else {
//           data[key] = value;
//         }
//       }
//     }
//     const revisedDocu = await docuService.reviseDocument(
//       docuId,
//       req.file,
//       data,
//     );
//     res.json(revisedDocu);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.patch("/routeDocuments", async (req, res) => {
//   try {
//     const { documents, updateFields } = req.body;
//     const routedDocs = await docuService.routeDocuments(
//       documents,
//       updateFields,
//     );
//     res.status(200).json(routedDocs);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.patch("/acceptDocs", async (req, res) => {
//   try {
//     const { documents, updateFields } = req.body;
//     const acceptedDocuments = await docuService.acceptDocuments(
//       documents,
//       updateFields,
//     );
//     res.status(200).json(acceptedDocuments);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.post("/annotate", async (req, res) => {
//   try {
//     const annotatedDoc = await docuService.annotateDocument(req.body);
//     res.status(200).json(annotatedDoc);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.put("/updateAnnotation", async (req, res) => {
//   try {
//     const updatedAnnotation = await docuService.updateAnnotation(req.body);
//     res.status(200).json(updatedAnnotation);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.delete("/deleteAnnotation", async (req, res) => {
//   try {
//     const { annotationId } = req.query;
//     const deletedAnnotation = await docuService.deleteAnnotation(
//       parseInt(annotationId, 10),
//     );
//     res.status(200).json(deletedAnnotation);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.put("/holdDocument", async (req, res) => {
//   try {
//     const { documents, remarks } = req.body;
//     const onholdDocuments = await docuService.holdDocument(documents, remarks);
//     res.status(200).json(onholdDocuments);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.put("/rerouteDocuments", async (req, res) => {
//   try {
//     const { documents, updateFields } = req.body;
//     const reroutedDoc = await docuService.rerouteDocument(
//       documents,
//       updateFields,
//     );
//     res.status(200).json(reroutedDoc);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.put("/saveDocument", async (req, res) => {
//   try {
//     const { documents, updateFields } = req.body;
//     const savedDoc = await docuService.saveDocument(documents, updateFields);
//     res.status(200).json(savedDoc);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.patch("/transmitDocs", async (req, res) => {
//   try {
//     const io = req.app.get("socketio");
//     const { documents, updateFields } = req.body;
//     const transmittedDocs = await docuService.transmitDocs(
//       documents,
//       updateFields,
//     );
//     const { destinations } = updateFields;
//     // Emit notifications for each recipient
//     destinations.forEach((dest) => {
//       const roomName = dest?.destination; // Ensure unitId corresponds to the room naming
//       io.to(roomName).emit("documentNotif", {
//         message: `${updateFields?.lastSource?.destination} transmitted ${documents.length
//           } ${documents.length > 1 ? "documents" : "document"} to your unit.`,
//         documentId: documents.map((doc) => doc?.id),
//         sender: updateFields?.lastSource?.destination,
//         recipient: dest?.destination,
//       });
//     });
//     res.status(200).json(transmittedDocs);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.patch("/returnDocs", async (req, res) => {
//   try {
//     const io = req.app.get("socketio");
//     const { documents, updateFields } = req.body;
//     const transmittedDocs = await docuService.returnDocs(
//       documents,
//       updateFields,
//     );
//     const { destinations } = updateFields;
//     // Emit notifications for each recipient
//     destinations.forEach((dest) => {
//       const roomName = dest?.destination; // Ensure unitId corresponds to the room naming
//       io.to(roomName).emit("documentNotif", {
//         message: `${updateFields?.lastSource?.destination} returned ${documents.length
//           } ${documents.length > 1 ? "documents" : "document"} to your unit.`,
//         documentId: documents.map((doc) => doc?.id),
//         sender: updateFields?.lastSource?.destination,
//         recipient: dest?.destination,
//       });
//     });
//     res.status(200).json(transmittedDocs);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.put("/returnDocument", async (req, res) => {
//   try {
//     const returnedDoc = await docuService.returnDocument(req.body);
//     res.status(200).json(returnedDoc);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.put("/attachDocument/:id", uploadFile, async (req, res) => {
//   try {
//     const docuId = parseInt(req.params.id, 10);
//     let data = {};
//     for (const [key, value] of Object.entries(req.body)) {
//       if (value) {
//         if (key === "isReadable") {
//           data[key] = parseInt(value, 10);
//         } else if (key === "uploader" || key === "files") {
//           data[key] = JSON.parse(value);
//         } else {
//           data[key] = value;
//         }
//       }
//     }
//     const attachedDocument = await docuService.attachDocument(
//       docuId,
//       req.file,
//       data,
//     );
//     res.status(200).json(attachedDocument);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// documentsRouter.post("/validateDocument", uploadFile, async (req, res) => {
//   try {
//     const { classification } = req.body;
//     const file = req.file;
//     if (!file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }
//     const validatedDocument = await docuService.validateDocument(
//       file,
//       parseInt(classification, 10),
//     );
//     res.json(validatedDocument);
//   } catch (error) {
//     console.error("Controller: Error validating document:", error);
//     res.status(500).json({ error: error.message });
//   }
// });
// System settings endpoints
    // Find the cutoffEnabled setting
// documentsRouter.patch("/markAsDone", async (req, res) => {
//   try {
//     const markedDocs = await docuService.markAsDone(req.body);
//     res.status(200).json(markedDocs);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// CRUD functions
// documentsRouter.post("/addDocument", uploadFile, async (req, res) => {
//   try {
//     const io = req.app.get("socketio");
//     let data = {};
//     for (const [key, value] of Object.entries(req.body)) {
//       if (value) {
//         if (
//           key === "isReadable" ||
//           key === "status" ||
//           key === "complexity" ||
//           key === "classification" ||
//           key === "acceptStatus"
//         ) {
//           data[key] = parseInt(value, 10);
//         } else if (
//           key === "action" ||
//           key === "primarySources" ||
//           key === "lastSource" ||
//           key === "destinations" ||
//           key === "annotation" ||
//           key === "currentOwner" ||
//           key === "uploadedBy"
//         ) {
//           data[key] = JSON.parse(value);
//         } else {
//           data[key] = value;
//         }
//       }
//     }
//     const newDocument = await docuService.addDocument(req.file, data);
//     const { destinations, lastSource } = data;
//     // Emit notifications for each recipient
//     destinations.forEach((dest) => {
//       const roomName = `room-${dest?.id}`; // Ensure unitId corresponds to the room naming
//       io.to(roomName).emit("documentNotif", {
//         message: `${lastSource[0]?.destination} transmitted a document to your unit.`,
//         documentId: newDocument?.id,
//         sender: lastSource[0]?.destination,
//         recipient: dest?.destination,
//       });
//     });
//     res.status(201).json(newDocument);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// documentsRouter.get("/getAllDocuments", async (req, res) => {
//   try {
//     // const { page = 1, pageSize = 10 } = req.query; // Default values
//     // const pageNumber = parseInt(page, 10);
//     // const limit = parseInt(pageSize, 10);
//     const fetchedDocus = await docuService.getAllDocuments();
//     res.json(fetchedDocus);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.get("/getSpecificDocuments", async (req, res) => {
//   try {
//     const { auth, category } = req.query;
//     const fetchedDocus = await docuService.getSpecificDocuments(
//       { ...auth, id: parseInt(auth.id, 10) },
//       category,
//     );
//     res.json(fetchedDocus);
//   } catch (error) {
//     console.log(error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.get("/getDocuById/:id", async (req, res) => {
//   try {
//     const docuId = parseInt(req.params.id, 10);
//     const fetchedDocu = await docuService.getDocuById(docuId);
//     res.json(fetchedDocu);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.put("/updateDocument/:id", async (req, res) => {
//   try {
//     const docuId = parseInt(req.params.id, 10);
//     const updatedDocu = await docuService.updateDocument(docuId, req.body);
//     res.json(updatedDocu);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.patch("/patchUpdate", async (req, res) => {
//   try {
//     const { documents, updateFields } = req.body;
//     const updatedDocs = await docuService.patchUpdateDocuments(
//       documents,
//       updateFields,
//     );
//     res.status(200).json(updatedDocs);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.post("/deleteDocuments", async (req, res) => {
//   try {
//     const deletedDocu = await docuService.deleteDocuments(req.body);
//     res.json(deletedDocu);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// =========================
// documentsRouter.get("/filterDocLogs", async (req, res) => {
//   try {
//     const filters = {};
//     // Loop through the query parameters and add them to the filters object
//     for (const [key, value] of Object.entries(req.query)) {
//       if (value) {
//         if (key === "docuId" || key === "status") {
//           filters[key] = parseInt(value, 10);
//         } else {
//           filters[key] = value;
//         }
//       }
//     }
//     if (Object.keys(filters).length === 0) {
//       return res.status(200).json([]);
//     }
//     const fetchedDocus = await docuService.filterDocLogs(filters);
//     res.json(fetchedDocus);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.get("/recentDocuments", async (req, res) => {
//   try {
//     const { destinations } = req.query;
//     const fetchedDocus = await docuService.recentDocuments(destinations);
//     res.json(fetchedDocus);
//   } catch (error) {
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     res.status(statusCode).json({ error: errorMessage });
//   }
// });
// documentsRouter.put("/revertDocument/:id", async (req, res) => {
//   try {
//     const docuId = parseInt(req.params.id, 10);
//     if (isNaN(docuId)) {
//       return res.status(400).json({ error: "Invalid document ID" });
//     }
//     const { document, remarks } = req.body;
//     const {
//       id,
//       docuId: docId,
//       annotations,
//       tableSelected,
//       ...documentData
//     } = document;
//     // documentData = Object.fromEntries(
//     //   Object.entries(documentData).filter(([key, value]) => !!value)
//     // );
//     // if (Object.keys(documentData).length === 0) {
//     //   return res.status(400).json({ error: "No valid fields to update" });
//     // }
//     const revertedDocu = await docuService.revertDocument(
//       docuId,
//       documentData,
//       remarks,
//     );
//     // Return the reverted document
//     return res.status(200).json(revertedDocu);
//   } catch (error) {
//     console.error("Revert document error:", error);
//     const statusCode = error.statusCode || 500;
//     const errorMessage = error.message || "Internal server error";
//     return res.status(statusCode).json({ error: errorMessage });
//   }
// });
    // Check if the file exists
    // Send the file as a stream