import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  // Store text-based registration fields.
  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    demoVoterId: '',
    walletAddress: '',
  });

  // Store uploaded files.
  const [document, setDocument] = useState(null);
  const [referenceFace, setReferenceFace] = useState(null);

  // Store consent checkbox state.
  const [consent, setConsent] = useState(false);

  // Store success or error messages.
  const [msg, setMsg] = useState('');

  // Access navigation function.
  const nav = useNavigate();

  // Update text field values.
  const handleChange = (e) => {
    setF({
      ...f,
      [e.target.name]: e.target.value,
    });
  };

  // Submit registration form.
  const submit = async (e) => {
    e.preventDefault();

    // Validate uploaded files.
    if (!document || !referenceFace) {
      setMsg('Please upload both the demo document and reference face photo.');
      return;
    }

    // Validate consent.
    if (!consent) {
      setMsg('Please provide consent to use these demo images.');
      return;
    }

    try {
      // Create multipart form data.
      const formData = new FormData();

      // Add text fields.
      formData.append('name', f.name);
      formData.append('email', f.email);
      formData.append('password', f.password);
      formData.append('demoVoterId', f.demoVoterId);
      formData.append('walletAddress', f.walletAddress);

      // Add uploaded files.
      formData.append('document', document);
      formData.append('referenceFace', referenceFace);

      // Add consent confirmation.
      formData.append('consent', 'true');

      // Send multipart request to backend.
      await api.post('/auth/register', formData);

      // Display success message.
      setMsg('Registered successfully. You can now log in.');

      // Redirect to login page.
      setTimeout(() => nav('/login'), 1000);
    } catch (x) {
      // Display backend error message.
      setMsg(x.response?.data?.message || x.message);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 bg-white p-6 rounded-2xl border">
      <h1 className="text-2xl font-bold mb-2">
        Demo Voter Registration
      </h1>

      <p className="text-sm text-slate-600 mb-4">
        Use only fictional demo voter details and consented test images.
      </p>

      <form onSubmit={submit} className="space-y-3">
        {/* Text input fields */}
        {[
          ['name', 'Name'],
          ['email', 'Email'],
          ['password', 'Password'],
          ['demoVoterId', 'Demo voter ID'],
          ['walletAddress', 'Wallet address (optional)'],
        ].map(([name, placeholder]) => (
          <input
            key={name}
            className="w-full border p-3 rounded"
            name={name}
            placeholder={placeholder}
            type={name === 'password' ? 'password' : 'text'}
            value={f[name]}
            onChange={handleChange}
            required={name !== 'walletAddress'}
          />
        ))}

        {/* Demo voter document upload */}
        <div>
          <label className="block font-medium mb-1">
            Demo voter document
          </label>

          <input
            className="w-full border p-2 rounded"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setDocument(e.target.files[0])}
            required
          />

          <p className="text-xs text-slate-500 mt-1">
            Use a fictional document or sample ID.
          </p>
        </div>

        {/* Reference face photo upload */}
        <div>
          <label className="block font-medium mb-1">
            Reference face photo
          </label>

          <input
            className="w-full border p-2 rounded"
            type="file"
            accept="image/*"
            onChange={(e) => setReferenceFace(e.target.files[0])}
            required
          />

          <p className="text-xs text-slate-500 mt-1">
            Upload a clear, consented photo of the same demo person.
          </p>
        </div>

        {/* Consent checkbox */}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            required
          />

          <span>
            I consent to using these images for this educational prototype.
          </span>
        </label>

        {/* Submit button */}
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-3 rounded"
        >
          Create demo account
        </button>
      </form>

      {/* Display status message */}
      {msg && (
        <p className="mt-3 text-sm">
          {msg}
        </p>
      )}
    </div>
  );
}