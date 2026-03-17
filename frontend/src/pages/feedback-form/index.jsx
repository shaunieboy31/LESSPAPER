import React, { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Container,
} from "@mui/material";
import useAxiosPrivate from "contexts/interceptors/axios";
import { enqueueSnackbar } from "notistack";
import * as LucideIcons from "lucide-react";
import SelectDivision from "components/Textfields/SelectDivision";
import SelectSystem from "components/Textfields/SelectSystem";
import StarRating from "../../components/StarRating/StarRating";

const initialFeedback = {
  name: null,
  divisionId: null,
  systemId: null,
  designation: null,
  answers: [],
  comments: "",
};

// const criteriaConfig = [
//   {
//     key: "visualDesign",
//     label: "Visual Design & Aesthetics",
//     description: "How visually appealing and modern does the system look?",
//     icon: Palette,
//   },
//   {
//     key: "usability",
//     label: "Usability & User Experience",
//     description: "How intuitive and easy to use is the system?",
//     icon: Users,
//   },
//   {
//     key: "systemPerformance",
//     label: "System Performance",
//     description:
//       "How satisfied are you with the overall speed and responsiveness of the system?",
//     icon: Zap,
//   },
//   {
//     key: "taskCompletion",
//     label: "Task Completion",
//     description: "Were you able to complete your tasks without issues?",
//     icon: CheckCircle,
//   },
//   {
//     key: "reliability",
//     label: "Reliability & Stability",
//     description: "Have you experienced any errors, bugs, or downtime?",
//     icon: Shield,
//   },
//   {
//     key: "consistency",
//     label: "Design Consistency",
//     description:
//       "How consistent are the patterns and behaviors across different parts of the system?",
//     icon: BarChart3,
//   },
//   {
//     key: "accessibility",
//     label: "Accessibility",
//     description:
//       "How well does the system support different devices and accessibility standards?",
//     icon: Smartphone, // or Accessibility icon if you have one
//   },
// ];

export default function FeedbackForm() {
  const axiosPrivate = useAxiosPrivate();

  const [criterias, setCriterias] = useState([]);

  const [feedback, setFeedback] = useState(initialFeedback);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleGetAll = () => {
    setLoading(true);

    axiosPrivate
      .get(`/libraries/getAllCriterias`)
      .then((e) => {
        setCriterias(e.data);
      })
      .catch((err) => {
        console.log(err);

        enqueueSnackbar(err?.message, {
          variant: "error",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    handleGetAll();
  }, []);

  // const handleRatingChange = (id, rating) => {
  //   setFeedback((prev) => ({
  //     ...prev,
  //     answers: [...prev.answers, { [id]: rating }],
  //   }));
  // };

  const handleRatingChange = (criteriaId, rating) => {
    setFeedback((prev) => {
      const exists = prev.answers.some(
        (answer) => answer.criteriaId === criteriaId
      );

      return {
        ...prev,
        answers: exists
          ? prev.answers.map((answer) =>
              answer.criteriaId === criteriaId ? { ...answer, rating } : answer
            )
          : [...prev.answers, { criteriaId, rating }],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    axiosPrivate
      .post(`/feedbacks/submitFeedback`, feedback)
      .then(() => {
        enqueueSnackbar("Feedback submitted successfully", {
          variant: "success",
        });
      })
      .catch((err) => {
        console.log(err);

        enqueueSnackbar(err?.message, {
          variant: "error",
        });
      })
      .finally(() => {
        setLoading(false);
      });

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset form after 3 seconds
    // setTimeout(() => {
    //   setIsSubmitted(false);
    //   setFeedback(initialFeedback);
    // }, 3000);
  };

  const isFormValid =
    (Object.entries(feedback).some(
      ([key, value]) => key !== "comments" && value > 0
    ) &&
      criterias.length === feedback.answers.length) ||
    feedback.comments.trim().length > 0;

  if (isSubmitted) {
    return (
      <Container maxWidth="md" sx={{ p: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            textAlign: "center",
            border: "1px solid #fbbf24",
            borderRadius: { xs: 2, sm: 3 },
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box
            sx={{
              width: { xs: 50, sm: 64 },
              height: { xs: 50, sm: 64 },
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: { xs: 1.5, sm: 2 },
              background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Send fontSize={{ xs: 24, sm: 32 }} color="white" />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#292524",
              mb: 1,
              fontSize: { xs: "1.8rem", sm: "2.125rem" },
            }}
          >
            Thank You!
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#44403c",
              fontSize: { xs: "0.9rem", sm: "1rem" },
            }}
          >
            Your feedback has been submitted successfully. We appreciate your
            input!
          </Typography>
          <Button
            onClick={() => {
              setIsSubmitted(false);
              setFeedback(initialFeedback);
            }}
            variant="outlined"
            // size={{ xs: "medium", sm: "large" }}
            sx={{
              mt: { xs: 2, sm: 3 },
              px: { xs: 3, sm: 4 },
              py: { xs: 1, sm: 1.5 },
              border: "2px solid #8B4513",
              color: "#8B4513",
              backgroundColor: "rgba(139, 69, 19, 0.05)",
              borderRadius: { xs: "8px", sm: "12px" },
              fontWeight: 600,
              fontSize: { xs: "0.9rem", sm: "1rem" },
              textTransform: "none",
              transition: "all 0.3s ease",
              "&:hover": {
                backgroundColor: "#8B4513",
                color: "#FFF",
                borderColor: "#8B4513",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(139, 69, 19, 0.3)",
              },
              "&:active": {
                transform: "translateY(0)",
                boxShadow: "0 4px 15px rgba(139, 69, 19, 0.2)",
              },
            }}
          >
            Submit Another Feedback
          </Button>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box>
        <CircularProgress />
      </Box>
    );
  }

  // console.log(feedback);

  return (
    <Box>
      <Box
        component="header"
        sx={{
          width: "100%",
          textAlign: "center",
          py: { xs: 4, sm: 5, md: 6 },
          // px: { xs: 2, sm: 3 },
          background:
            "linear-gradient(135deg, rgba(92, 78, 66, 0.95) 0%, rgba(68, 64, 60, 0.9) 50%, rgba(41, 37, 36, 0.95) 100%)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)",
            pointerEvents: "none",
          },
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 70% 80%, rgba(139, 69, 19, 0.1) 0%, transparent 50%)",
            pointerEvents: "none",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 1.5, sm: 2 },
            mb: { xs: 1.5, sm: 2 },
            position: "relative",
            zIndex: 1,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box
            sx={{
              width: { xs: 50, sm: 60 },
              height: { xs: 50, sm: 60 },
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              borderRadius: { xs: 2, sm: 3 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              border: "2px solid rgba(251, 191, 36, 0.4)",
              boxShadow: "0 6px 24px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "scale(1.05)",
                boxShadow: "0 8px 32px rgba(251, 191, 36, 0.3)",
              },
            }}
          >
            <MessageSquare fontSize={{ xs: 24, sm: 28 }} color="#fef3c7" />
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.5rem" },
              fontWeight: "bold",
              color: "#fef3c7",
              lineHeight: 1.2,
              textShadow: "0 3px 6px rgba(0, 0, 0, 0.3)",
              letterSpacing: "-0.02em",
              textAlign: { xs: "center", sm: "left" },
            }}
          >
            Systems Feedback
          </Typography>
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: "rgba(254, 243, 199, 0.9)",
            lineHeight: 1.5,
            mx: "auto",
            fontWeight: 400,
            maxWidth: { xs: "100%", sm: "500px", md: "600px" },
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            position: "relative",
            zIndex: 1,
            fontSize: { xs: "0.95rem", sm: "1rem", md: "1.1rem" },
            px: { xs: 1, sm: 0 },
          }}
        >
          Help us improve our systems by sharing your experience. Your feedback
          shapes the future of our components and documentation.
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2 } }}>
          <Paper
            elevation={12}
            sx={{
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(12px)",
              borderRadius: { xs: 3, sm: 4, md: 6 },
              border: "1px solid rgba(168, 162, 158, 0.2)",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2, sm: 2.5 },
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                border: "1px solid rgba(168, 162, 158, 0.2)",
                borderRadius: { xs: "6px", sm: "8px" },
                p: { xs: 2, sm: 3 },
                boxShadow: "0 3px 15px rgba(0, 0, 0, 0.08)",
                backdropFilter: "blur(4px)",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 6px 25px rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: "#8B4513",
                  mb: { xs: 1.5, sm: 2 },
                  borderBottom: "2px solid #8B4513",
                  pb: { xs: 1, sm: 1.5 },
                  fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  textAlign: "center",
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: "-2px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: { xs: "40px", sm: "50px" },
                    height: "2px",
                    background:
                      "linear-gradient(90deg, #8B4513 0%, #D2691E 100%)",
                    borderRadius: "2px",
                  },
                }}
              >
                User Information
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1, sm: 1.5 },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "600",
                    color: "#8B4513",
                    fontSize: { xs: "13px", sm: "14px" },
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Full Name
                </Typography>
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="Enter your full name"
                  value={feedback.name}
                  onChange={(e) =>
                    setFeedback((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      "& fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.3)",
                        borderWidth: "2px",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#8B4513",
                        boxShadow: "0 0 0 2px rgba(139, 69, 19, 0.2)",
                      },
                    },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1, sm: 1.5 },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "600",
                    color: "#8B4513",
                    fontSize: { xs: "13px", sm: "14px" },
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Designation
                </Typography>
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="Enter your designation"
                  value={feedback.designation}
                  onChange={(e) =>
                    setFeedback((prev) => ({
                      ...prev,
                      designation: e.target.value,
                    }))
                  }
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      "& fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.3)",
                        borderWidth: "2px",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#8B4513",
                        boxShadow: "0 0 0 2px rgba(139, 69, 19, 0.2)",
                      },
                    },
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1, sm: 1.5 },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "600",
                    color: "#8B4513",
                    fontSize: { xs: "13px", sm: "14px" },
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Which system to give feedback
                </Typography>
                <SelectSystem
                  placeholder="Choose which system to give feedback"
                  name="systemId"
                  value={feedback.systemId}
                  onChange={(fieldName, selectedValue) => {
                    setFeedback((prev) => ({
                      ...prev,
                      systemId: selectedValue,
                    }));
                  }}
                  disabled={loading}
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      "& fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.3)",
                        borderWidth: "2px",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#8B4513",
                        boxShadow: "0 0 0 2px rgba(139, 69, 19, 0.2)",
                      },
                    },
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1, sm: 1.5 },
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "600",
                    color: "#8B4513",
                    fontSize: { xs: "13px", sm: "14px" },
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Division
                </Typography>
                <SelectDivision
                  placeholder="Choose your Division"
                  name="divisionId"
                  value={feedback.divisionId}
                  onChange={(fieldName, selectedValue) => {
                    setFeedback((prev) => ({
                      ...prev,
                      divisionId: selectedValue,
                    }));
                  }}
                  disabled={loading}
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      "& fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.3)",
                        borderWidth: "2px",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#8B4513",
                        boxShadow: "0 0 0 2px rgba(139, 69, 19, 0.2)",
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>

      <Box sx={{ px: { xs: 1, sm: 2 }, pb: 4 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 1, sm: 2 } }}>
          <Paper
            elevation={12}
            sx={{
              background: "rgba(255, 255, 255, 0.98)",
              backdropFilter: "blur(12px)",
              borderRadius: { xs: 3, sm: 4, md: 6 },
              border: "1px solid rgba(168, 162, 158, 0.2)",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: { xs: 2, sm: 3 },
                "& > * + *": { mt: { xs: 2, sm: 3 } },
              }}
            >
              <Box sx={{ display: "grid", gap: { xs: 2, sm: 2.5 } }}>
                {criterias.map(({ id, label, description, icon }) => {
                  const Icon = LucideIcons[icon];

                  return (
                    <Paper
                      key={id}
                      elevation={3}
                      sx={{
                        p: { xs: 2, sm: 3 },
                        borderRadius: { xs: 2, sm: 3 },
                        border: "2px solid rgba(139, 69, 19, 0.2)",
                        background:
                          "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(254, 243, 199, 0.4) 100%)",
                        backdropFilter: "blur(8px)",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        position: "relative",
                        overflow: "hidden",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "3px",
                          background:
                            "linear-gradient(90deg, #8B4513 0%, #D2691E 50%, #8B4513 100%)",
                        },
                        "&:hover": {
                          borderColor: "rgba(139, 69, 19, 0.5)",
                          background:
                            "linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(254, 240, 138, 0.5) 100%)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 8px 20px rgba(139, 69, 19, 0.2)",
                          "& .icon-container": {
                            transform: "scale(1.1) rotate(3deg)",
                          },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: { xs: 1, sm: 1.5 },
                        }}
                      >
                        <Box
                          className="icon-container"
                          sx={{
                            p: 2,
                            borderRadius: { xs: 1.5, sm: 2 },
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            background:
                              "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #A0522D 100%)",
                            boxShadow: "0 6px 15px rgba(139, 69, 19, 0.3)",
                            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              borderRadius: { xs: 1.5, sm: 2 },
                              background:
                                "linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%)",
                            },
                          }}
                        >
                          <Icon fontSize={{ xs: 4, sm: 8 }} color="white" />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <StarRating
                            rating={
                              feedback.answers.find(
                                (answer) => answer.criteriaId === id
                              )?.rating
                            }
                            onRatingChange={(rating) =>
                              handleRatingChange(id, rating)
                            }
                            label={label}
                            description={description}
                          />
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>

              <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, sm: 3 },
                  border: "2px solid rgba(139, 69, 19, 0.2)",
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(254, 243, 199, 0.4) 100%)",
                  backdropFilter: "blur(8px)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "3px",
                    background:
                      "linear-gradient(90deg, #8B4513 0%, #D2691E 50%, #8B4513 100%)",
                  },
                  "&:hover": {
                    borderColor: "rgba(139, 69, 19, 0.5)",
                    background:
                      "linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(254, 240, 138, 0.5) 100%)",
                    transform: "translateY(-1px)",
                    boxShadow: "0 6px 20px rgba(139, 69, 19, 0.15)",
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    display: "block",
                    fontWeight: 600,
                    color: "#8B4513",
                    mb: { xs: 1.5, sm: 2 },
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    position: "relative",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: "-6px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: "80%",
                      height: "2px",
                      background:
                        "linear-gradient(90deg, #8B4513 0%, #D2691E 100%)",
                      borderRadius: "2px",
                    },
                  }}
                >
                  Additional Comments & Suggestions
                </Typography>
                <TextField
                  id="comments"
                  multiline
                  rows={4}
                  fullWidth
                  value={feedback.comments}
                  onChange={(e) =>
                    setFeedback((prev) => ({
                      ...prev,
                      comments: e.target.value,
                    }))
                  }
                  placeholder="Share any specific feedback, suggestions for improvement, or features you'd like to see..."
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(8px)",
                      borderRadius: 2,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "& fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.3)",
                        borderWidth: "2px",
                        borderRadius: 2,
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(139, 69, 19, 0.5)",
                        boxShadow: "0 3px 10px rgba(139, 69, 19, 0.1)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#8B4513",
                        boxShadow: "0 0 0 2px rgba(139, 69, 19, 0.2)",
                      },
                    },
                    "& .MuiInputBase-input": {
                      color: "#292524",
                      fontSize: { xs: "0.9rem", sm: "0.95rem" },
                      lineHeight: 1.5,
                      "&::placeholder": {
                        color: "rgba(139, 69, 19, 0.6)",
                        opacity: 1,
                        fontSize: { xs: "0.9rem", sm: "0.95rem" },
                      },
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(139, 69, 19, 0.7)",
                    mt: { xs: 1, sm: 1.5 },
                    display: "block",
                    textAlign: "center",
                    fontSize: { xs: "0.8rem", sm: "0.85rem" },
                    fontStyle: "italic",
                  }}
                >
                  Optional: Tell us more about your experience or suggest
                  improvements
                </Typography>
              </Paper>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  pt: { xs: 2, sm: 3 },
                  borderTop: "2px solid rgba(139, 69, 19, 0.2)",
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(139, 69, 19, 0.05) 50%, transparent 100%)",
                  borderRadius: 2,
                  mt: { xs: 1, sm: 1.5 },
                }}
              >
                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  variant="contained"
                  // size={{ xs: "small", sm: "medium" }}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress
                        size={{ xs: 16, sm: 20 }}
                        color="inherit"
                      />
                    ) : (
                      <Send fontSize={{ xs: "8px", sm: "12px" }} />
                    )
                  }
                  sx={{
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1, sm: 1.5 },
                    fontWeight: 700,
                    borderRadius: { xs: 2, sm: 3 },
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    background:
                      "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #A0522D 100%)",
                    color: "white",
                    boxShadow: "0 8px 20px rgba(139, 69, 19, 0.4)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                      transition: "left 0.5s",
                    },
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #A0522D 0%, #8B4513 50%, #D2691E 100%)",
                      boxShadow: "0 12px 28px rgba(139, 69, 19, 0.6)",
                      transform: "translateY(-2px)",
                      "&::before": {
                        left: "100%",
                      },
                    },
                    "&:active": {
                      transform: "translateY(-1px)",
                      boxShadow: "0 6px 12px rgba(139, 69, 19, 0.4)",
                    },
                    "&:focus": {
                      outline: "none",
                      boxShadow: "0 0 0 3px rgba(139, 69, 19, 0.3)",
                    },
                    "&:disabled": {
                      opacity: 0.6,
                      cursor: "not-allowed",
                      transform: "none",
                      boxShadow: "0 3px 6px rgba(139, 69, 19, 0.2)",
                    },
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
