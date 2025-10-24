import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const VerifyEmailNotice = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    try {
      const response = await api.post('/auth/resend-verification', {
        email: user.email
      });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
      setMessage('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please check your email and click the verification link to continue.
          </p>
        </div>
        
        {message && (
          <div className="p-4 bg-green-100 rounded text-green-700">{message}</div>
        )}
        {error && (
          <div className="p-4 bg-red-100 rounded text-red-700">{error}</div>
        )}

        <button
          onClick={handleResendVerification}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailNotice;