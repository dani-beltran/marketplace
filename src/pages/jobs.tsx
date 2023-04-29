import { useEffect, useState } from "react";
import Head from "next/head";
import { Container } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { pageFetch } from "@/utils/pagination";
import { Job } from "@/lib/prisma-client";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", width: 150 },
  { field: "description", headerName: "Brief description", width: 400 },
];

export default function Jobs() {
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [rowCount, setRowCount] = useState(0);
  const [jobs, setData] = useState([] as Job[]);
  const [error, setError] = useState(null);

  const fetchJobs = async () => {
    return pageFetch<Job>(process.env.NEXT_PUBLIC_API_URL + "/jobs", {
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
    })
      .then(({ data, pagination }) => {
        setData(data);
        setRowCount(pagination.count);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  useEffect(() => {
    fetchJobs();
  }, [paginationModel]);

  return (
    <>
      <Head>
        <title>Git Marketplace</title>
        <meta
          name="description"
          content="A marketplace for developers collaboration on open source projects"
        />
      </Head>

      <Container maxWidth="sm">
        <h1>Jobs</h1>
      </Container>
      {error && (
        <Container sx={{ textAlign: "center", padding: "50px 0 50px 0" }}>
          {error}
        </Container>
      )}
      {!error && (
        <DataGrid
          rows={jobs}
          columns={columns}
          loading={false}
          paginationMode="server"
          rowCount={rowCount}
          rowHeight={90}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
        ></DataGrid>
      )}
    </>
  );
}
