import { Box } from "@mui/material";
import EditableTable from "components/Table/EditableTable";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import React from "react";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function CriteriasTable({ data, loadingState }) {
  const columns = [
    // { field: "id", headerName: "ID", width: 70 },
    {
      field: "name",
      headerName: "Respondent Name",
      width: 200,
    },
    {
      field: "designation",
      headerName: "Designation",
      width: 200,
    },
    {
      field: "division",
      headerName: "Division",
      width: 200,
      valueGetter: (params) => {
        const { division } = params.row;

        return division?.name;
      },
    },
    {
      field: "comments",
      headerName: "Comments",
      width: 300,
    },
    {
      field: "system",
      headerName: "System",
      width: 150,
      valueGetter: (params) => params.row.system?.name,
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 200,
      valueGetter: (params) =>
        params.value ? dayjs(params.value).format("MM/DD/YYYY hh:mm A") : null,
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <EditableTable
        data={data}
        columns={columns}
        loading={loadingState}
        height="60vh"
        showSearch
      />
    </Box>
  );
}
