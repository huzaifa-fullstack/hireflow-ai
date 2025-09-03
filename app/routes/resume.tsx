import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Summary from "~/components/Summary";
import Details from "~/components/Details";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "HireFlow | Review" },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated)
      navigate(`/auth?next=/resume/${id}`);
  }, [isLoading]);

  useEffect(() => {
    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);

      if (!resume) return;
      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
      const resumeUrl = URL.createObjectURL(pdfBlob);
      setResumeUrl(resumeUrl);

      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;

      const imageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(imageUrl);

      // Parse feedback if it's a string, otherwise use as-is
      try {
        const parsedFeedback =
          typeof data.feedback === "string"
            ? JSON.parse(data.feedback)
            : data.feedback;

        setFeedback(parsedFeedback);
        console.log({ resumeUrl, imageUrl, feedback: parsedFeedback });
      } catch (feedbackError) {
        console.error("Error parsing feedback data:", feedbackError);
        console.error("Raw feedback data:", data.feedback);
        // Set null feedback to show loading state instead of crashing
        setFeedback(null);
      }
    };

    loadResume();
  }, [id]);

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">
            Back to Homepage
          </span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover min-h-screen lg:h-screen lg:sticky lg:top-0 flex items-center justify-center px-2">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  alt="Resume Preview"
                  className="w-full h-auto max-h-[85vh] lg:max-h-[85vh] object-contain"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS
                score={feedback.ATS.score || 0}
                suggestions={feedback.ATS.tips || []}
              />
              <Details feedback={feedback} />
            </div>
          ) : (
            <img
              src="/images/resume-scan-2.gif"
              alt="Resume GIF"
              className="w-full"
            />
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
