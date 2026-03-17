import { io } from 'socket.io-client';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9000';
// const BASE_URL = "http://localhost:9000";
// const BASE_URL = "http://172.16.0.25:7000"; // testing
// const BASE_URL = "http://172.16.0.27:8000";
// const BASE_URL = "https://lesspaper.depedimuscity.com:8000";
// const BASE_URL = "https://lpsgentri.depedimuscity.com:9000";
// const BASE_URL = "https://egov.depeddasma.edu.ph:8000";
// const BASE_URL = "https://lesspaper.depedbinancity.ph:8000";

const socket = io(BASE_URL); // Initialize but don't connect automatically

export default socket;
