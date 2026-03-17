import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import AddOfficeModal from 'modals/offices/AddOfficeModal';
import UpdateOfficeModal from 'modals/offices/UpdateOfficeModal';
import useAxiosPrivate from 'contexts/interceptors/axios';

import { ImOffice } from 'react-icons/im';

import PageTemplate from 'layouts/PageTemplate';
import OfficesTable from './OfficesTable';

export default function Offices() {
  const axiosPrivate = useAxiosPrivate();

  const [data, setData] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState([]);

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
      .get(`/libraries/getAllOffices`)
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
    if (!selectedOffice?.length) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [selectedOffice]);

  return (
    <PageTemplate
      icon={
        <ImOffice
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Offices/Schools"
      modals={[
        <AddOfficeModal
          handleClose={() => setOpenAddModal(false)}
          open={openAddModal}
          updateTableFunction={handleGetAll}
        />,
        <UpdateOfficeModal
          handleClose={() => setOpenUpdateModal(false)}
          open={openUpdateModal}
          data={selectedOffice && selectedOffice[0]}
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
        <OfficesTable
          data={data}
          setSelectedData={setSelectedOffice}
          loadingState={loading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
