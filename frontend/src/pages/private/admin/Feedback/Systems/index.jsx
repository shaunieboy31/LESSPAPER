import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import useAxiosPrivate from 'contexts/interceptors/axios';

import { MdFeedback } from 'react-icons/md';

import PageTemplate from 'layouts/PageTemplate';
import AddSystemModal from 'modals/systems/AddSystemModal';
import UpdateSystemModal from 'modals/systems/UpdateSystemModal';
import SystemsTable from './SystemsTable';

export default function Systems() {
  const axiosPrivate = useAxiosPrivate();

  const [data, setData] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState([]);

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
      .get(`/libraries/getAllSystems`)
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
    if (!selectedSystem?.length) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [selectedSystem]);

  return (
    <PageTemplate
      icon={
        <MdFeedback
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Systems"
      modals={[
        <AddSystemModal
          handleClose={() => setOpenAddModal(false)}
          open={openAddModal}
          updateTableFunction={handleGetAll}
        />,
        <UpdateSystemModal
          handleClose={() => setOpenUpdateModal(false)}
          open={openUpdateModal}
          data={selectedSystem && selectedSystem[0]}
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
        <SystemsTable
          data={data}
          setSelectedData={setSelectedSystem}
          loadingState={loading}
          updateTableFunction={handleGetAll}
        />
      }
    />
  );
}
