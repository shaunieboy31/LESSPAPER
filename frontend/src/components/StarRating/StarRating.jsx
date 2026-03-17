import React from "react";
import { Star } from "lucide-react";
import { IconButton, Typography, Box } from "@mui/material";

export default function StarRating({
  rating,
  onRatingChange,
  label,
  description,
}) {
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <Box sx={{ "& > * + *": { mt: 1 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: "#292524",
              fontSize: "0.875rem",
            }}
          >
            {label}
          </Typography>
          {description && (
            <Typography
              variant="caption"
              sx={{
                color: "rgba(120, 113, 108, 0.8)",
                fontSize: "0.75rem",
                mt: 0.5,
                display: "block",
              }}
            >
              {description}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <IconButton
              key={star}
              type="button"
              sx={{
                p: 0.5,
                borderRadius: "50%",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: "rgba(251, 191, 36, 0.2)",
                },
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => onRatingChange(star)}
            >
              <Star
                size={20}
                style={{
                  transition: "all 0.2s ease-in-out",
                  color:
                    star <= (hoverRating || rating) ? "#f59e0b" : "#a8a29e",
                  fill: star <= (hoverRating || rating) ? "#f59e0b" : "none",
                }}
              />
            </IconButton>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
