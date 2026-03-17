import React, { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import AddUserModal from 'modals/users/AddUserModal';
import UpdateUserModal from 'modals/users/UpdateUserModal';
import useAxiosPrivate from 'contexts/interceptors/axios';

import { HiUsers } from 'react-icons/hi2';

import DisplayCreatedUserModal from 'modals/users/DisplayCreatedUserModal';
import PageTemplate from 'layouts/PageTemplate';
import FaceRegistrationModal from 'modals/face-recognition/FaceRegistrationModal';
import Swal from 'sweetalert2';
import ManageSignaturesModal from 'modals/miscellaneous/ManageSignaturesModal';
import UsersTable from './UsersTable';
import confirmationIcon from '../../../../assets/images/face_recog_icon.png';

export default function Users() {
  const axiosPrivate = useAxiosPrivate();

  const [data, setData] = useState([]);
  const [selectedUser, setSelectedUser] = useState([]);
  const [createdUser, setCreatedUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState(false);

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [openSignaturesModal, setOpenSignaturesModal] = useState(false);
  const [openFaceRegister, setOpenFaceRegister] = useState(false);

  const handleOpen = type => {
    if (type === 'add') {
      setOpenAddModal(true);
    } else if (type === 'update') {
      setOpenUpdateModal(true);
    } else if (type === 'signatures') {
      setOpenSignaturesModal(true);
    }
  };

  const handleGetAll = () => {
    setLoading(true);
    setError('');

    axiosPrivate
      .get(`/user/getAllUsers`)
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
    if (!selectedUser?.length) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  }, [selectedUser]);

  const handleRegisterFace = () => {
    setOpenUpdateModal(false);
    Swal.fire({
      title: 'Get ready to smile 😊',
      text: "We'll take a quick snapshot to register your face. Make sure you're in a well-lit area!",
      imageUrl: confirmationIcon, // Replace with your own icon path
      imageWidth: 80,
      imageHeight: 80,
      imageAlt: 'Face Icon',
      showCancelButton: true,
      confirmButtonColor: '#4caf50', // Soft green
      customClass: {
        cancelButton: 'custom-cancel-button'
      },
      confirmButtonText: "Let's do it!",
      cancelButtonText: 'Maybe later'
    }).then(result => {
      if (result.isConfirmed) {
        setOpenFaceRegister(true);
      }
    });
  };

  return (
    <PageTemplate
      icon={
        <HiUsers
          style={{
            fontSize: '40px'
          }}
        />
      }
      header="Users"
      modals={[
        <AddUserModal
          open={openAddModal}
          handleClose={() => setOpenAddModal(false)}
          setCreatedUser={setCreatedUser}
          updateTableFunction={() => {
            handleGetAll();
          }}
        />,
        <UpdateUserModal
          handleClose={() => setOpenUpdateModal(false)}
          open={openUpdateModal}
          data={selectedUser && selectedUser[0]}
          setSelectedUser={setSelectedUser}
          handleRegisterFace={handleRegisterFace}
          updateTableFunction={() => {
            handleGetAll();
          }}
        />,
        <DisplayCreatedUserModal
          open={Boolean(createdUser)}
          handleClose={() => setCreatedUser(null)}
          data={createdUser}
        />,
        <ManageSignaturesModal
          open={openSignaturesModal}
          handleClose={() => setOpenSignaturesModal(false)}
        />,
        <FaceRegistrationModal
          open={openFaceRegister}
          handleClose={() => setOpenFaceRegister(false)}
          data={selectedUser && selectedUser[0]}
          onSuccess={() => {
            handleGetAll();
          }}
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
      rightButtons={[
        <Button
          onClick={() => handleOpen('signatures')}
          sx={{
            backgroundColor: '#246fc9',
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
          Manage Signatures
        </Button>
      ]}
      table={
        <UsersTable
          data={data}
          selectedData={selectedUser}
          setSelectedData={setSelectedUser}
          loadingState={loading}
          updateTableFunction={() => {
            handleGetAll();
          }}
        />
      }
    />
  );
}
