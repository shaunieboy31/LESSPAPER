/* eslint-disable prettier/prettier */
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';

const StateContext = createContext();

export function ContextProvider({ children }) {
  const isMobileDevice = () =>
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;

  const storedAuth = localStorage.getItem('authInfo');

  const [auth, setAuth] = useState(JSON.parse(storedAuth) || null);
  const [routingDocs, setRoutingDocs] = useState([]);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [usersRelatedUnits, setUsersRelatedUnits] = useState('');
  const [openSidebar, setOpenSidebar] = useState(!isMobileDevice());
  const [division, setDivision] = useState('imus');
  const [maxNumberOfSignatories, setMaxNumberOfSignatories] = useState(4);
  const [enableLimitNumberOfSignatories, setEnableLimitNumberOfSignatories] = useState(false);

  // ✅ Date/Time state synced via Socket.IO
  const [serverDate, setServerDate] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [isCutoffLocked, setIsCutoffLocked] = useState(false);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:9000');

    socket.on('cutOff', ({ serverDateTime, serverDate, serverTime, isLocked }) => {
      // ✅ Trust backend values directly
      const parsed = new Date(serverDateTime);

      if (!isNaN(parsed.getTime())) {
        setServerDate(serverDate);
        setServerTime(serverTime);
        setIsCutoffLocked(isLocked);
        if (auth?.role?.some(role => ['admin', 'sds'].includes(role))) {
          setIsCutoffLocked(false);
        }
      }
    });
    return () => socket.disconnect();
  }, [isCutoffLocked, auth]);

  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
  // const BASE_URL = "http://localhost:9000";
  // const BASE_URL = "https://lpsgentri.depedimuscity.com:9000";
  // const BASE_URL = "https://egov.depeddasma.edu.ph:8000";
  // const BASE_URL = "https://lesspaper.depedbinancity.ph:8000";

  // const socket = io(BASE_URL);

  // eslint-disable-next-line no-nested-ternary
  const referenceId = auth ? (auth?.officeId !== 1 ? auth.officeId : auth.unitId) : null;

  const contextValue = useMemo(
    () => ({
      auth,
      setAuth,
      selectedUserType,
      setSelectedUserType,
      usersRelatedUnits,
      setUsersRelatedUnits,
      routingDocs,
      setRoutingDocs,
      BASE_URL,
      referenceId,
      openSidebar,
      setOpenSidebar,
      division,
      setDivision,
      maxNumberOfSignatories,
      setMaxNumberOfSignatories,
      enableLimitNumberOfSignatories,
      setEnableLimitNumberOfSignatories,
      isCutoffLocked,
      serverDate,
      serverTime
    }),
    [
      auth,
      setAuth,
      selectedUserType,
      setSelectedUserType,
      usersRelatedUnits,
      setUsersRelatedUnits,
      routingDocs,
      setRoutingDocs,
      BASE_URL,
      referenceId,
      openSidebar,
      setOpenSidebar,
      division,
      setDivision,
      maxNumberOfSignatories,
      setMaxNumberOfSignatories,
      enableLimitNumberOfSignatories,
      setEnableLimitNumberOfSignatories,
      isCutoffLocked,
      serverDate,
      serverTime
    ]
  );

  return <StateContext.Provider value={contextValue}>{children}</StateContext.Provider>;
}

export const useStateContext = () => useContext(StateContext);

ContextProvider.propTypes = {
  children: PropTypes.node.isRequired
};
