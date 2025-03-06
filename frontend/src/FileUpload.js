import React, { useState } from "react";
import { Button, Box, Typography } from "@mui/material";

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("No file selected!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/uploadfile/", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setUploadStatus(`Upload successful: ${data.filename}`);
      } else {
        setUploadStatus(`Error: ${data.detail}`);
      }
    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus("Upload failed");
    }
  };

  return (
    <Box sx={{ textAlign: "center", padding: 2 }}>
      <input type="file" onChange={handleFileChange} />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        sx={{ marginLeft: 2 }}
      >
        Upload
      </Button>
      {uploadStatus && <Typography sx={{ marginTop: 2 }}>{uploadStatus}</Typography>}
    </Box>
  );
};

export default FileUpload;
