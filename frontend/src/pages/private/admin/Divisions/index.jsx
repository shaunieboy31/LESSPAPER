import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import useAxiosPrivate from 'contexts/interceptors/axios';

import { ImOffice } from 'react-icons/im';

import PageTemplate from 'layouts/PageTemplate';
import AddDivisionModal from 'modals/divisions/AddDivisionModal';
import UpdateDivisionModal from 'modals/divisions/UpdateDivisionModal';
import DivisionsTable from './DivisionsTable';

export default function Divisions() {
  const axiosPrivate = useAxiosPrivate();

  const [data, setData] = useState([]);
  const [selectedDivision, setSelectedDivision] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(false);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);

  const handleOpen = type => {
    if (type === 'add') {
      setOpenAddModal(true);
    } else if (type === 'update') {
      setOpenUpdateModal(true);
    }
  };

  const handleGetAll = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get(`/libraries/getAllDivisions`)
      .then(e => {
        setData(e.data);
      })
      .catch(err => {
        setError(err?.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    handleGetAll();
  }, []);

  useEffect(() => {
    if (!selectedDivision?.length) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [selectedDivision]);

  return (
    <PageTemplate
      icon={
        <ImOffice
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Divisions"
      modals={[
        <AddDivisionModal
          handleClose={() => setOpenAddModal(false)}
          open={openAddModal}
          updateTableFunction={handleGetAll}
        />,
        <UpdateDivisionModal
          handleClose={() => setOpenUpdateModal(false)}
          open={openUpdateModal}
          data={selectedDivision && selectedDivision[0]}
          updateTableFunction={handleGetAll}
        />
      ]}
      error={error}
      leftButtons={[
        <Button
          onClick={() => handleOpen('add')}
          sx={{
            backgroundColor: 'green',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '5px 20px',
            borderRadius: '20px',
            boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: '#a2cb6b',
              color: '#1f1f1f',
              fontWeight: 'bold'
            }
          }}
        >
          <AddIcon sx={{ mr: '10px' }} />
          Add
        </Button>,
        <Button
          onClick={() => handleOpen('update')}
          disabled={disabled}
          sx={{
            backgroundColor: disabled ? 'lightgray' : '#246fc9',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            padding: '5px 20px',
            borderRadius: '20px',
            boxShadow: '1px 1px 5px rgba(0, 0, 0, 0.5)',
            '&:hover': {
              backgroundColor: '#a2cb6b',
              color: '#1f1f1f',
              fontWeight: 'bold'
            }
          }}
        >
          <EditIcon sx={{ mr: '10px' }} />
          Update
        </Button>
      ]}
      table={
        <DivisionsTable
          data={data}
          setSelectedData={setSelectedDivision}
          loadingState={loading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
