/* eslint-disable no-alert */
import { useEffect, useState } from 'react';
import { Box, Button, TextField } from '@mui/material';

import EditNoteIcon from '@mui/icons-material/EditNote';

import { object, string } from 'yup';
import { useFormik } from 'formik';
import useAxiosPrivate from 'contexts/interceptors/axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useStateContext } from 'contexts/ContextProvider';
import { enqueueSnackbar } from 'notistack';
import LPSModal from 'layouts/ModalLayout';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function AnnotateDocumentModal({
  open,
  handleClose,
  updateTableFunction,
  loadingState,
  selectedData
}) {
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();
  const [rowData, setRowData] = useState();
  const [disabled, setDisabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      annotation: ''
    },

    validationSchema: object().shape({
      annotation: string().required('Required')
    }),
    onSubmit: values => {
      const confirmed = window.confirm('Are you sure you want to submit this annotation?');

      if (confirmed) {
        setLoading(true);
        setError('');

        axiosPrivate
          .post(`/documents/annotate`, {
            docuId: rowData.id,
            annotation: {
              annotation: values.annotation,
              annotatedBy: `${auth?.firstName} ${auth?.lastName} from ${
                auth?.officeId === 1 ? auth?.unitName : auth?.officeName
              }`
            },
            remarks: `Annotation added by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          })
          .then(() => {
            enqueueSnackbar('Annotation Successfully Added', {
              variant: 'success'
            });
            formik.resetForm();
            updateTableFunction();
            handleClose();
          })
          .catch(err => {
            setError(err.response.data.error);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  });

  useEffect(() => {
    setDisabled(!formik.values.annotation);
  }, [formik.values]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (selectedData) {
      if (Array.isArray(selectedData) && selectedData.length > 0) {
        // eslint-disable-next-line prefer-destructuring
        setRowData(selectedData[0]);
      } else {
        setRowData(selectedData);
      }
    }
  }, [selectedData]);

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Annotate Document"
      headerColor="#09504a"
      disableButton={disabled}
      loading={loading}
      error={error}
      withSpacing
      buttons={[
        <Button
          variant="contained"
          startIcon={<EditNoteIcon />}
          onClick={() => formik.handleSubmit()}
          disabled={disabled}
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: disabled ? 'lightgray' : '#09504a',
            color: '#fff',
            py: 1,
            px: 2,
            // width: "10vw",
            // minWidth: "100px",
            '&:hover': {
              backgroundColor: '#a2cb6b',
              color: '#1f1f1f',
              fontWeight: 'bold'
            }
          }}
        >
          Annotate
        </Button>
      ]}
    >
      <Box>
        <TextField
          label="Annotation"
          name="annotation"
          variant="outlined"
          disabled={loading}
          value={formik.values.annotation}
          onChange={formik.handleChange}
          onBlur={formik.handleBLur}
          error={formik.touched.annotation && Boolean(formik.errors.annotation)}
          helperText={formik.touched.annotation && formik.errors.annotation}
          multiline
          rows={4}
          sx={{
            width: '100%',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'black !important'
              }
            }
          }}
        />
      </Box>
    </LPSModal>
  );
}
