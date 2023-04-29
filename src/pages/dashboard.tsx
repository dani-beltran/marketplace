import { useEffect, useState } from "react";
import Head from "next/head";
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import type {} from "@mui/x-data-grid/themeAugmentation";
import { Job } from "@/lib/prisma-client";
import { useSession } from "next-auth/react";
import RequireLogin from "@/components/requireLogin";
import { CreateJobBody } from "./api/jobs";
import { createJob, getJobs } from "@/utils/api-client";
import Loading from "@/components/loading";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", width: 150 },
  { field: "description", headerName: "Brief description", width: 400 },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [rowCount, setRowCount] = useState(0);
  const [jobs, setData] = useState([] as Job[]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);

  const fetchJobs = async (userId: number) => {
    return getJobs(
      {
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        userId,
      }
    )
      .then(({ data, pagination }) => {
        setData(data);
        setRowCount(pagination.count);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchJobs(session.user.id);
      setLoading(false);
    }
  }, [paginationModel, session]);

  if (status === "unauthenticated") {
    return <RequireLogin callbackUrl="/profile"></RequireLogin>;
  }

  const ready = !loading && !error;

  return (
    <>
      <Head>
        <title>Profile - A Git Marketplace</title>
        <meta
          name="description"
          content="Your profile page in the Git marketplace"
        />
      </Head>

      <Container maxWidth="sm">
        <Container sx={{ marginBottom: "2rem" }}>
          <h1>My published Jobs</h1>
        </Container>
        <Container sx={{ marginBottom: "1rem" }}>
          <Button variant="outlined" onClick={() => setOpenForm(true)}>
            Create
          </Button>
        </Container>
        {loading && <Loading></Loading>}
        {error && (
          <Container sx={{ textAlign: "center", padding: "50px 0 50px 0" }}>
            {error}
          </Container>
        )}
        {ready && !jobs.length && (
          <Container sx={{ textAlign: "center", padding: "50px 0 50px 0" }}>
            No jobs found
          </Container>
        )}
        {ready && jobs.length !== 0 && (
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
        <CreateJobDialogForm
          open={openForm}
          handleClose={() => setOpenForm(false)}
          handleSubmit={(values: CreateJobBody) => {
            createJob(values)
              .then(() => {
                setOpenForm(false);
                if (session?.user?.id) {
                  fetchJobs(session.user.id);
                }
              })
              .catch((err) => {
                console.error(err);
              });
          }}
        ></CreateJobDialogForm>
      </Container>
    </>
  );
}

function CreateJobDialogForm({
  open,
  handleClose,
  handleSubmit,
}: {
  open: boolean;
  handleClose: () => void;
  handleSubmit: (values: CreateJobBody) => void;
}) {
  const [values, setValues] = useState({
    name: "",
    issueUrl: "",
    description: "",
  });
  const onChange = (e: any) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  return (
    <>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Publish a new job offer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please fill in the following fields to publish a new job offer.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Title"
            type="text"
            fullWidth
            variant="standard"
            onChange={onChange}
            value={values.name}
          />
          <TextField
            margin="dense"
            name="issueUrl"
            label="Issue URL"
            type="text"
            fullWidth
            variant="standard"
            onChange={onChange}
            value={values.issueUrl}
          />
          <TextField
            name="description"
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            multiline
            maxRows={4}
            minRows={4}
            onChange={onChange}
            value={values.description}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={() => handleSubmit(values)}>Publish</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
