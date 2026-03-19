/* eslint-disable react/no-array-index-key */
/* eslint-disable no-alert */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Divider,
  Skeleton,
  IconButton,
  TextField,
  Button,
  Tooltip
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CircleIcon from '@mui/icons-material/Circle';
import DiamondIcon from '@mui/icons-material/Diamond';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import LPSModal from 'layouts/ModalLayout';
import { useStateContext } from 'contexts/ContextProvider';
import useAxiosPrivate from 'contexts/interceptors/axios';
import { enqueueSnackbar } from 'notistack';

// Component definitions moved outside to avoid re-creation on every render
function InfoSection({ title, children, icon: Icon }) {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: '1px solid #dee2e6',
        borderRadius: '12px',
        p: 3,
        mb: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {Icon && <Icon sx={{ color: '#1f1f1f', mr: 1, fontSize: '20px' }} />}
        <Typography
          sx={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#495057',
            fontFamily: 'Poppins'
          }}
        >
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Box>
  );
}

function InfoItem({ label, value, icon: Icon, showIcon = true }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        sx={{
          color: '#6c757d',
          fontWeight: '500',
          fontSize: '14px',
          mb: 0.5
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {showIcon && Icon && <Icon sx={{ fontSize: '16px', mr: 1, color: '#1f1f1f' }} />}
        <Typography
          sx={{
            textWrap: 'wrap',
            color: '#212529',
            fontWeight: '400',
            fontSize: '15px',
            fontFamily: 'Poppins'
          }}
        >
          {value || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
}

function ListItem({ item, icon: Icon = DiamondIcon }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        borderRadius: '8px',
        backgroundColor: '#fff',
        mb: 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: '#f8f9fa',
          transform: 'translateX(4px)'
        }
      }}
    >
      <Icon sx={{ fontSize: '16px', mr: 2, color: '#1f1f1f' }} />
      <Typography
        sx={{
          color: '#495057',
          fontWeight: '500',
          fontSize: '14px',
          fontFamily: 'Poppins'
        }}
      >
        {item?.destination || item}
      </Typography>
    </Box>
  );
}

function AnnotationItem({ annotation, currentUserUid, docuId, onEdit, onDelete }) {
  const axiosPrivate = useAxiosPrivate();
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(annotation?.annotation || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner =
    annotation?.annotatedByUid !== null &&
    annotation?.annotatedByUid !== undefined &&
    annotation?.annotatedByUid === currentUserUid;

  const handleSaveEdit = () => {
    if (!editedText.trim()) return;
    setSaving(true);
    axiosPrivate
      .put(`/documents/updateAnnotation`, {
        docuId,
        currentUserUid,
        annotation: {
          id: annotation.id,
          annotation: editedText.trim(),
          annotatedBy: annotation.annotatedBy,
          annotatedByUid: annotation.annotatedByUid
        },
        remarks: `Annotation edited`
      })
      .then(() => {
        enqueueSnackbar('Annotation updated successfully', { variant: 'success' });
        setEditing(false);
        if (onEdit) onEdit(annotation.id, editedText.trim());
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to update annotation';
        enqueueSnackbar(msg, { variant: 'error' });
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this annotation?')) return;
    setDeleting(true);
    axiosPrivate
      .delete(`/documents/deleteAnnotation`, {
        params: {
          annotationId: annotation.id,
          currentUserUid
        }
      })
      .then(() => {
        enqueueSnackbar('Annotation deleted successfully', { variant: 'success' });
        if (onDelete) onDelete(annotation.id);
      })
      .catch(err => {
        const msg = err?.response?.data?.error || err?.message || 'Failed to delete annotation';
        enqueueSnackbar(msg, { variant: 'error' });
      })
      .finally(() => setDeleting(false));
  };

  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        p: 2,
        mb: 2,
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <ArrowForwardIosIcon sx={{ fontSize: '16px', mr: 1, mt: 0.5, color: '#1f1f1f' }} />
        <Box sx={{ flex: 1 }}>
          {editing ? (
            <Box>
              <TextField
                multiline
                rows={3}
                fullWidth
                value={editedText}
                onChange={e => setEditedText(e.target.value)}
                disabled={saving}
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<CheckIcon />}
                  onClick={handleSaveEdit}
                  disabled={saving || !editedText.trim()}
                  sx={{ backgroundColor: '#09504a', '&:hover': { backgroundColor: '#a2cb6b', color: '#1f1f1f' } }}
                >
                  Save
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    setEditing(false);
                    setEditedText(annotation?.annotation || '');
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Typography
                  sx={{
                    color: '#212529',
                    fontWeight: '500',
                    fontSize: '15px',
                    mb: 1,
                    fontFamily: 'Poppins',
                    flex: 1
                  }}
                >
                  {annotation?.annotation}
                </Typography>

                {isOwner && (
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                    <Tooltip title="Edit annotation">
                      <IconButton
                        size="small"
                        onClick={() => setEditing(true)}
                        sx={{ color: '#1976d2', '&:hover': { backgroundColor: '#e3f2fd' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete annotation">
                      <IconButton
                        size="small"
                        onClick={handleDelete}
                        disabled={deleting}
                        sx={{ color: '#d32f2f', '&:hover': { backgroundColor: '#ffebee' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  flexDirection: 'column',
                  alignItems: 'start',
                  gap: 2
                }}
              >
                <Chip
                  icon={<PersonIcon />}
                  label={`By: ${annotation?.annotatedBy}`}
                  size="small"
                  sx={{
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    fontSize: '12px'
                  }}
                />
                <Chip
                  icon={<AccessTimeIcon />}
                  label={dayjs(annotation?.createdAt).format('MM/DD/YYYY - hh:mm A')}
                  size="small"
                  sx={{
                    backgroundColor: '#f3e5f5',
                    color: '#7b1fa2',
                    fontSize: '12px'
                  }}
                />
                {annotation?.dateUpdated && (
                  <Chip
                    icon={<AccessTimeIcon />}
                    label={`Updated: ${dayjs(annotation?.dateUpdated).format('MM/DD/YYYY - hh:mm A')}`}
                    size="small"
                    sx={{
                      backgroundColor: '#fff3e0',
                      color: '#f57c00',
                      fontSize: '12px'
                    }}
                  />
                )}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default function DetailsModal({ open, handleClose, rowData, onAnnotationChange }) {
  const { auth } = useStateContext();
  const [annotations, setAnnotations] = useState([]);
  const [actions, setActions] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [primarySources, setPrimarySources] = useState([]);
  const [lastSources, setLastSources] = useState([]);
  const [routedBy, setRoutedBy] = useState([]);
  const [signatories, setSignatories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [docuId, setDocuId] = useState(null);

  // Update a single annotation text locally
  const handleAnnotationEdited = (annotationId, newText) => {
    setAnnotations(prev =>
      prev.map(a =>
        a.id === annotationId ? { ...a, annotation: newText, dateUpdated: new Date().toISOString() } : a
      )
    );
    if (onAnnotationChange) onAnnotationChange();
  };

  // Remove a single annotation locally
  const handleAnnotationDeleted = annotationId => {
    setAnnotations(prev => prev.filter(a => a.id !== annotationId));
    if (onAnnotationChange) onAnnotationChange();
  };

  useEffect(() => {
    if (rowData) {
      setLoading(true);
      try {
        const id = rowData?.id || rowData?.docuId;
        setDocuId(id);
        setAnnotations(rowData?.annotations || []);
        setDestinations(rowData?.destinations || []);
        setPrimarySources(rowData?.primarySources || []);
        setLastSources(rowData?.lastSource || []);
        setRoutedBy(rowData?.routedBy || []);
        setActions(rowData?.action || {});

        const docAutoInitials = rowData.autoInitials || [];
        const docManualInitials = rowData.manualInitials || [];

        const combinedSignatories = [...docAutoInitials, ...docManualInitials];

        setSignatories(combinedSignatories);
      } catch (error) {
        console.error('Error processing row data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [rowData]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ p: 2 }}>
          {[...Array(6)].map((_, index) => (
            <Skeleton
              key={index}
              variant="rectangular"
              height={80}
              sx={{ mb: 2, borderRadius: 2 }}
            />
          ))}
        </Box>
      );
    }

    if (!rowData) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#6c757d', fontSize: '16px' }}>
            No document data available
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2 }}>
        {/* Basic Information */}
        <InfoSection title="Document Information">
          <InfoItem label="Title" value={rowData?.title} />
          <InfoItem label="Document Type" value={rowData?.docType} />
          <InfoItem label="LPS Number" value={rowData?.lpsNo} />
          <InfoItem label="Remarks" value={rowData?.remarks} />
        </InfoSection>

        {/* Destinations */}
        {destinations?.length > 0 && (
          <InfoSection title="Destinations" icon={DiamondIcon}>
            {destinations.map((destination, index) => (
              <ListItem key={index} item={destination} />
            ))}
          </InfoSection>
        )}

        {/* Primary Sources */}
        {primarySources?.length > 0 && (
          <InfoSection title="Primary Sources" icon={DiamondIcon}>
            {primarySources.map((prim, index) => (
              <ListItem key={index} item={prim} />
            ))}
          </InfoSection>
        )}

        {/* Last Sources */}
        {lastSources?.length > 0 && (
          <InfoSection title="Last Sources" icon={DiamondIcon}>
            {lastSources.map((last, index) => (
              <ListItem key={index} item={last} />
            ))}
          </InfoSection>
        )}

        {/* Actions and Prepare */}
        {(actions?.action?.length > 0 || actions?.prepare?.length > 0) && (
          <InfoSection title="Actions & Requirements" icon={CircleIcon}>
            {actions?.action?.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: '600', color: '#495057', mb: 1 }}>
                  Actions:
                </Typography>
                {actions.action.map((action, index) => (
                  <ListItem key={index} item={action} icon={CircleIcon} />
                ))}
              </Box>
            )}
            {actions?.prepare?.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: '600', color: '#495057', mb: 1 }}>
                  Prepare:
                </Typography>
                {actions.prepare.map((req, index) => (
                  <ListItem key={index} item={req} icon={CircleIcon} />
                ))}
              </Box>
            )}
          </InfoSection>
        )}

        {/* Signatories */}
        {signatories?.length > 0 && (
          <InfoSection title="Signatories" icon={DiamondIcon}>
            {signatories.map((signatory, index) => (
              <ListItem key={index} item={signatory} />
            ))}
          </InfoSection>
        )}

        {/* Routed By */}
        {routedBy?.length > 0 && (
          <InfoSection title="Routed By" icon={DiamondIcon}>
            {routedBy.map((router, index) => (
              <ListItem key={index} item={router} />
            ))}
          </InfoSection>
        )}

        {/* Annotations */}
        {annotations?.length > 0 && (
          <InfoSection title="Annotations" icon={ArrowForwardIosIcon}>
            {annotations.map((annotation, index) => (
              <AnnotationItem
                key={`${annotation.id}-${index}`}
                annotation={annotation}
                currentUserUid={auth?.uid}
                docuId={docuId}
                onEdit={handleAnnotationEdited}
                onDelete={handleAnnotationDeleted}
              />
            ))}
          </InfoSection>
        )}
      </Box>
    );
  };

  return (
    <LPSModal
      open={open}
      handleClose={handleClose}
      title="Document Details"
      headerColor="#09504a"
      width="1200px"
      loading={loading}
      withSpacing={false}
    >
      {renderContent()}
    </LPSModal>
  );
}
