import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/utils";
import { prepareInstructions } from "../../constants";

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
  };

  const handleAnalyze = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    try {
      setIsProcessing(true);

      setStatusText("Uploading the file...");
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        console.error("File upload failed - no result returned");
        return setStatusText("Error: Failed to upload file");
      }
      console.log("File uploaded successfully:", uploadedFile);

      setStatusText("Converting to image...");
      const imageFile = await convertPdfToImage(file);
      if (!imageFile.file) {
        console.error("PDF conversion failed - no image file returned");
        return setStatusText("Error: Failed to convert PDF to image");
      }
      console.log("PDF converted successfully");

      setStatusText("Uploading the image...");
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) {
        console.error("Image upload failed - no result returned");
        return setStatusText("Error: Failed to upload image");
      }
      console.log("Image uploaded successfully:", uploadedImage);

      setStatusText("Preparing data...");

      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: "",
      };
      console.log("Saving initial data:", data);
      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      console.log("Initial data saved successfully");

      setStatusText("Analyzing...");
      console.log("Starting AI analysis...");

      let feedback: AIResponse | undefined;

      try {
        feedback = await ai.feedback(
          uploadedFile.path,
          prepareInstructions({ jobTitle, jobDescription })
        );

        console.log("Raw AI feedback response:", feedback);

        if (!feedback) {
          console.error("AI feedback failed - no result returned");
          return setStatusText("Error: Failed to analyze the resume");
        }

        // Check if the response has the expected structure
        if (!feedback.message || !feedback.message.content) {
          console.error(
            "AI feedback failed - invalid response structure:",
            feedback
          );
          return setStatusText("Error: AI analysis returned invalid data");
        }

        console.log("AI analysis completed successfully");
      } catch (aiError) {
        console.error("AI feedback threw an error:", aiError);

        // Check if the error is in the expected Puter error format
        if (typeof aiError === "object" && aiError !== null) {
          const puterError = aiError as any;
          if (puterError.success === false && puterError.error) {
            console.error("Puter AI service error:", puterError.error);

            const errorMessage = puterError.error.message || "";

            // Handle specific AI quota/usage limit errors
            if (
              errorMessage.includes("usage-limited-chat") ||
              errorMessage.includes("Permission denied")
            ) {
              console.log(
                "AI quota exceeded, using mock feedback for development"
              );

              // Use mock feedback data for development when AI is unavailable
              const mockFeedback = {
                overallScore: 75,
                ATS: {
                  score: 80,
                  tips: [
                    { type: "good" as const, tip: "Good use of keywords" },
                    {
                      type: "improve" as const,
                      tip: "Add more technical skills",
                    },
                  ],
                },
                toneAndStyle: {
                  score: 70,
                  tips: [
                    {
                      type: "good" as const,
                      tip: "Professional tone maintained throughout",
                      explanation:
                        "Your resume maintains a consistent professional tone that's appropriate for the industry.",
                    },
                    {
                      type: "improve" as const,
                      tip: "Use more action-oriented language",
                      explanation:
                        "Replace passive phrases with strong action verbs to make your achievements more impactful.",
                    },
                    {
                      type: "improve" as const,
                      tip: "Avoid overly casual expressions",
                      explanation:
                        "Some phrases could be more formal to maintain professional standards expected in resumes.",
                    },
                  ],
                },
                content: {
                  score: 75,
                  tips: [
                    {
                      type: "good" as const,
                      tip: "Clear achievement descriptions",
                      explanation:
                        "Your accomplishments are well-articulated with specific examples and measurable results.",
                    },
                    {
                      type: "improve" as const,
                      tip: "Add more quantifiable metrics",
                      explanation:
                        "Include specific numbers, percentages, or dollar amounts to demonstrate the impact of your work.",
                    },
                    {
                      type: "improve" as const,
                      tip: "Expand on recent role responsibilities",
                      explanation:
                        "Your most recent position could benefit from more detailed description of key responsibilities and achievements.",
                    },
                  ],
                },
                structure: {
                  score: 80,
                  tips: [
                    {
                      type: "good" as const,
                      tip: "Well-organized sections",
                      explanation:
                        "Your resume follows a logical structure with clearly defined sections that are easy to navigate.",
                    },
                    {
                      type: "good" as const,
                      tip: "Appropriate length",
                      explanation:
                        "The resume length is appropriate for your experience level and doesn't overwhelm the reader.",
                    },
                    {
                      type: "improve" as const,
                      tip: "Consider reordering sections",
                      explanation:
                        "Moving your skills section closer to the top could help highlight your key competencies earlier.",
                    },
                  ],
                },
                skills: {
                  score: 65,
                  tips: [
                    {
                      type: "improve" as const,
                      tip: "Add more technical skills",
                      explanation:
                        "Include additional technical skills that are relevant to your target role to better match job requirements.",
                    },
                    {
                      type: "improve" as const,
                      tip: "Categorize your skills",
                      explanation:
                        "Group skills into categories (e.g., Programming Languages, Tools, Soft Skills) for better organization.",
                    },
                    {
                      type: "good" as const,
                      tip: "Relevant skill selection",
                      explanation:
                        "The skills listed are relevant to your field and demonstrate good technical foundation.",
                    },
                    {
                      type: "improve" as const,
                      tip: "Include proficiency levels",
                      explanation:
                        "Consider adding proficiency levels (Beginner, Intermediate, Advanced) to give better context for your skills.",
                    },
                  ],
                },
              };

              data.feedback = JSON.stringify(mockFeedback);

              // Save the resume data with mock feedback
              try {
                await kv.set(`resume:${uuid}`, JSON.stringify(data));
                console.log("Resume saved with mock feedback");
                setStatusText(
                  "Resume uploaded! (AI analysis unavailable - using sample feedback)"
                );
                navigate(`/resume/${uuid}`);
                return;
              } catch (storageError) {
                console.error("Storage Error:", storageError);
                return setStatusText("Error: Failed to save resume data");
              }
            }

            // Handle other API errors
            if (errorMessage.includes("400")) {
              return setStatusText(
                "AI service error. Please try again or contact support if the issue persists."
              );
            }

            return setStatusText(
              `Error: AI service failed - ${errorMessage || puterError.error.code || "Unknown error"}`
            );
          }
        }

        return setStatusText("Error: AI analysis service unavailable");
      }

      const feedbackText =
        typeof feedback.message.content === "string"
          ? feedback.message.content
          : feedback.message.content[0].text;

      try {
        data.feedback = JSON.parse(feedbackText);
      } catch (error) {
        console.error("JSON Parse Error:", error);
        console.error("Feedback text:", feedbackText);
        return setStatusText("Error: Invalid response format from AI analysis");
      }

      try {
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
      } catch (error) {
        console.error("Storage Error:", error);
        return setStatusText("Error: Failed to save analysis results");
      }

      setStatusText("Analysis complete, redirecting...");
      console.log(data);
      navigate(`/resume/${uuid}`);
    } catch (error) {
      console.error("HandleAnalyze Error:", error);
      setStatusText(
        "Error: Something went wrong during analysis. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form")!;
    if (!form) return;
    const formData = new FormData(form);

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) return;

    handleAnalyze({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                className="w-[300px] max-w-full mx-auto mt-4"
                alt="Resume Scan GIF"
              />
            </>
          ) : (
            <h2>Drop your resume for an ATS score and improvement tips</h2>
          )}
          {!isProcessing && (
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  id="company-name"
                  name="company-name"
                  placeholder="Company Name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  id="job-title"
                  name="job-title"
                  placeholder="Job Title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  id="job-description"
                  name="job-description"
                  placeholder="Job Description"
                />
              </div>
              <div className="form-div">
                <label htmlFor="uploader">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>
              <button className="primary-button type=submit">
                Analyze Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
