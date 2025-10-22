app.post("/api/worker-verification",
  upload.fields([{ name: "selfie" }, { name: "idPhoto" }]),
  async (req, res) => {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "medpost.verified@gmail.com",
      subject: "Worker Verification",
      text: "New worker verification submitted.",
      attachments: [
        { filename: "selfie.jpg", content: req.files.selfie[0].buffer },
        { filename: "id.jpg", content: req.files.idPhoto[0].buffer },
      ],
    });
    res.json({ success: true });
  }
);

app.post("/api/facility-verification",
  upload.single("certification"),
  async (req, res) => {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "medpost.verified@gmail.com",
      subject: "Facility Verification",
      text: "New facility certification submitted.",
      attachments: [
        { filename: "certification.jpg", content: req.file.buffer },
      ],
    });
    res.json({ success: true });
  }
);
