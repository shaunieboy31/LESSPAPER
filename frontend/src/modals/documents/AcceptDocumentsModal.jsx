/* eslint-disable no-nested-ternary */
/* eslint-disable no-alert */
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  Typography
} from '@mui/material';

import ShortcutIcon from '@mui/icons-material/Shortcut';

import { useEffect, useState } from 'react';
import useAxiosPrivate from 'contexts/interceptors/axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useStateContext } from 'contexts/ContextProvider';
import { enqueueSnackbar } from 'notistack';
import LPSModal from 'layouts/ModalLayout';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function AcceptDocumentsModal({
  open,
  handleClose,
  loadingState,
  selectedData,
  updateTableFunction
}) {
  const { auth } = useStateContext();
  const axiosPrivate = useAxiosPrivate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const [isForSignature, setIsForSignature] = useState(true);

  const [promptResponse, setPromptResponse] = useState(1);

  const manyDocuments = selectedData?.length > 1;

  const handleSubmit = () => {
    const confirmed = window.confirm(
      `Are you sure you want to ${promptResponse === 1 ? 'sign' : 'accept'} ${
        manyDocuments ? 'these' : 'this'
      } ${manyDocuments ? 'documents' : 'document'}?`
    );

    if (confirmed) {
      setLoading(true);
      setError('');

      axiosPrivate
        .patch(`/documents/acceptDocs`, {
          documents: selectedData,
          updateFields: {
            currentOwner: [
              {
                id: auth?.officeId === 1 ? auth?.unitId : auth?.officeId,
                destination: auth?.officeId === 1 ? auth?.unitName : auth?.officeName,
                type: auth?.officeId === 1 ? 'unit' : 'office'
              }
            ],
            ...(auth?.unitId !== 12
              ? {
                  status:
                    auth?.role?.some(role => ['unit head', 'chief'].includes(role)) &&
                    promptResponse === 1
                      ? 7
                      : auth?.role?.some(role => ['unit head', 'chief'].includes(role)) &&
                        (promptResponse === 2 || promptResponse === 3)
                      ? 3
                      : promptResponse === 1
                      ? 7
                      : promptResponse === 2
                      ? 8
                      : 1
                }
              : promptResponse === 1
              ? {
                  status: auth?.role?.some(role => ['unit head', 'chief'].includes(role)) ? 7 : 3
                }
              : promptResponse === 2
              ? {
                  status: auth?.role?.some(role => ['unit head', 'chief'].includes(role)) && 3
                }
              : null),
            acceptStatus: 1,
            remarks: `Accepted by ${auth?.firstName} ${auth?.lastName} from ${
              auth?.officeId === 1 ? auth?.unitName : auth?.officeName
            }`
          }
        })
        .then(() => {
          enqueueSnackbar(`Document${selectedData.length > 1 ? 's' : ''} Accepted`, {
            variant: 'success'
          });
          updateTableFunction();
          handleClose();
        })
        .catch(err => {
          setError(err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Accept Documents"
      // disableButton={disabled}
      loading={loading}
      headerColor="#09504a"
      error={error}
      withSpacing
      buttons={[
        <Button
          variant="contained"
          startIcon={<ShortcutIcon />}
          onClick={() => handleSubmit()}
          disabled={loading}
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: loading ? 'lightgray' : '#09504a',
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
          Accept
        </Button>
      ]}
    >
      <Box
        sx={{
          // background: "#fff",
          // background: "#ebebeb",
          // border: "solid 1px #b6b6b6",
          // borderRadius: "4px",
          width: '100%',
          mb: 2
          // p: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: 'gray'
          }}
        >
          {`Would you want to sign ${manyDocuments ? 'these' : 'this'} ${
            manyDocuments ? 'documents' : 'document'
          } first?`}
        </Typography>
        <FormControl>
          <FormGroup
            column
            sx={{
              p: '16px 0 0 16px',
              gap: 2
            }}
          >
            {[
              { label: 'Yes', value: 1 },
              { label: 'No', value: 2 }
              // ...(auth?.unitId === 12
              //   ? [
              //       {
              //         label: "Accept (Depends on the classification)",
              //         value: 3,
              //       },
              //     ]
              //   : []),
            ].map(option => (
              <FormControlLabel
                key={option.value}
                control={
                  <Radio
                    color="success"
                    checked={promptResponse === option.value}
                    onChange={() => {
                      setPromptResponse(option.value);
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{
                      fontWeight: promptResponse === option.value ? 'bold' : 'normal',
                      color: promptResponse === option.value ? 'green' : 'gray'
                    }}
                  >
                    {option.label}
                  </Typography>
                }
              />
            ))}
          </FormGroup>
        </FormControl>
      </Box>
    </LPSModal>
  );
}
