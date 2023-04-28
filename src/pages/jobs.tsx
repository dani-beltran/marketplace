import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Head from "next/head";
import styles from "@/styles/Jobs.module.css";
import { Container, createTheme } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DataGrid, GridColDef, GridRowsProp } from "@mui/x-data-grid";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { Pagination } from "@/utils/pagination";
import { Job } from "@/lib/prisma-client";

const theme = createTheme({
  components: {
    // Use `MuiDataGrid` on DataGrid, DataGridPro and DataGridPremium
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "red",
        },
      },
    },
  },
});

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", width: 150 },
  { field: "description", headerName: "Brief description", width: 300 },
];

export default function Jobs() {
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 25,
    page: 0,
  });
  const [rowCount, setRowCount] = useState(0);
  const [jobs, setData] = useState([] as Job[]);

  useEffect(() => {
    pageFetch<Job[]>(
      "http://localhost:3000/api/jobs",
      setData,
      ({ page, size, total }) => {
        setPaginationModel({
          page,
          pageSize: size,
        });
        setRowCount(total);
      }
    );
  }, []);

  return (
    <>
      <Head>
        <title>Git Marketplace</title>
        <meta
          name="description"
          content="A marketplace for developers collaboration on open source projects"
        />
      </Head>
      <main className={styles.main}>
        <Container maxWidth="sm">
          <h1>Jobs</h1>
        </Container>
        {/* TODO: don't show the data grid when no jobs available, but a message */}
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
      </main>
    </>
  );
}

async function pageFetch<T>(
  url: string,
  setData: Dispatch<SetStateAction<T>>,
  setPagination: (pagination: Pagination) => void
) {
  const res = await (await fetch(url)).json();
  setData(res.data);
  setPagination(res.pagination);
}
