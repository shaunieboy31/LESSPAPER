import React, { useState } from "react";
import { BarChart, Bar, ResponsiveContainer, Cell, LabelList } from "recharts";
import "./barchart.css";
import { Box, Skeleton, Typography } from "@mui/material";

function Barchart({ data, showLabel, loadingState }) {
  function toCamelCase(str) {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  const getAbbreviation = (name) => {
    const words = name.split(" ");
    const initials = words.map((word) => {
      if (word.toLowerCase() === "alapan") {
        return `${toCamelCase(word)}`;
      }
      if (word.toLowerCase() === "anabu") {
        return `${toCamelCase(word)}`;
      }
      if (word.toLowerCase() === "palico") {
        return `${toCamelCase(word)}`;
      }
      if (word.toLowerCase() === "tinabunan") {
        return `${toCamelCase(word)}`;
      }
      if (word.toLowerCase() === "toclong") {
        return `${toCamelCase(word)}`;
      }
      if (word.toUpperCase() === "I") {
        return `-${word.toUpperCase()}-`;
      }
      if (word.charAt(0).toUpperCase() === "I") {
        if (word.charAt(1).toUpperCase() === "I") {
          return `-${word.toUpperCase()}-`;
        }
      }
      return word.charAt(0).toUpperCase();
    });
    return initials.join("");
  };

  const submissionData = data?.map((evt) => ({
    name: evt?.officeName || "",
    abbreviation: getAbbreviation(evt?.officeName || ""),
    submission:
      evt?.completionRate === "0%"
        ? 0.5
        : parseFloat(evt.completionRate.replace("%", "")),
  }));
  const [activeIndex, setActiveIndex] = useState(0);

  // eslint-disable-next-line no-shadow
  const handleClick = (data, index) => {
    setActiveIndex(index);
  };

  const activeItem = submissionData[activeIndex];

  return (
    <Box
      sx={{
        width: "100%",
        minWidth: "1200px",
        height: "50vh",
        minHeight: "120px",
      }}
    >
      {loadingState ? (
        <Skeleton sx={{ height: "100%", width: "100%" }} />
      ) : (
        <ResponsiveContainer width="100%">
          <BarChart data={submissionData}>
            <Bar dataKey="submission" onClick={handleClick}>
              {showLabel && (
                <LabelList
                  dataKey="abbreviation"
                  position="insideBottom"
                  angle={-90}
                  dy={-50}
                  dx={0}
                />
              )}
              {submissionData.map((entry, index) => (
                <Cell
                  cursor="pointer"
                  fill={
                    // eslint-disable-next-line no-nested-ternary
                    entry.submission !== 0.5
                      ? index === activeIndex
                        ? "#82ca9d"
                        : "#8884d8"
                      : index === activeIndex
                      ? "#585858"
                      : "gray"
                  }
                  // eslint-disable-next-line react/no-array-index-key
                  key={`cell-${index}`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {loadingState ? (
        "Loading Schools Completion Rate..."
      ) : (
        <Typography className="content">{`Completion Rate of "${
          activeItem?.name
        }": ${
          activeItem?.submission === 0.5 ? 0 : activeItem?.submission
        }%`}</Typography>
      )}
    </Box>
  );
}

export default Barchart;
