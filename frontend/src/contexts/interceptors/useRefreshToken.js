import axios from 'axios';
import { useStateContext } from 'contexts/ContextProvider';

const useRefresh = () => {
  const { setAuth } = useStateContext();
  const { BASE_URL } = useStateContext();

  const refresh = async () => {
    await axios
      .post(
        `${BASE_URL}/user/refresh`,
        {},
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true
        }
      )
      .then(response => {
        setAuth(prev => {
          if (prev) {
            return { ...prev, accessToken: response.accessToken };
          }
          return response;
        });

        return response.accessToken;
      })
      .catch(err => {
        let message = '';
        if (err?.response?.status === 404) {
          message = 'Invalid Credentials';
        } else if (err?.response?.status === 401) {
          message = err?.response?.data?.error;
        } else {
          message = 'Internal Server Error';
        }
        console.log(message || err?.message);
      });
  };
  return refresh;
};

export default useRefresh;
