import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Shield, Key, Mail, User, Radio, ArrowRight, Phone, MapPin, Compass, Check, AlertCircle } from 'lucide-react';

export default function Login() {
  const { loginUser, registerUser, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tab states: 'login' | 'register'
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  
  // Common Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('BENEFICIARY'); // Only BENEFICIARY or VOLUNTEER
  const [loading, setLoading] = useState(false);

  // Beneficiary specific fields
  const [phone, setPhone] = useState('');
  const [locationName, setLocationName] = useState('');
  const [locationLat, setLocationLat] = useState('');
  const [locationLng, setLocationLng] = useState('');
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'detecting' | 'success' | 'denied'
  const [locationError, setLocationError] = useState(null);

  // Sync mode state with query params
  useEffect(() => {
    const queryMode = searchParams.get('mode');
    if (queryMode === 'register') {
      setMode('register');
    } else {
      setMode('login');
    }
  }, [searchParams]);

  // Session expired warning
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      showWarning('Operator session expired. Please re-authenticate.');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, showWarning]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationError('Geolocation is not supported by your browser.');
      showError('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('detecting');
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationLat(lat.toFixed(4));
        setLocationLng(lng.toFixed(4));
        setLocationStatus('success');
        showSuccess('Location successfully detected.');
        if (!locationName) {
          setLocationName('Hyderabad, Telangana'); // reasonable default example if empty
        }
      },
      (error) => {
        console.error(error);
        setLocationStatus('denied');
        setLocationError('Location access was denied. Please enter your location manually.');
        showWarning('Location access was denied. Please enter your location manually.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (mode === 'register' && !name)) {
      showError('Please fill out all required fields.');
      return;
    }

    // Beneficiary Validation
    if (mode === 'register' && role === 'BENEFICIARY') {
      if (!phone) {
        showError('Phone number is required for beneficiaries.');
        return;
      }
      const phoneRegex = /^\+?[0-9\s\-()]{10,20}$/;
      if (!phoneRegex.test(phone.trim())) {
        showError('Please enter a valid phone number (at least 10 digits).');
        return;
      }
      if (!locationName) {
        showError('Location name is required for beneficiaries.');
        return;
      }
      if (!locationLat || !locationLng) {
        showError('Latitude and longitude coordinates are required. Please use current location or input coordinates.');
        return;
      }
      const latVal = parseFloat(locationLat);
      const lngVal = parseFloat(locationLng);
      if (isNaN(latVal) || latVal < -90 || latVal > 90) {
        showError('Latitude must be a valid number between -90 and 90.');
        return;
      }
      if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
        showError('Longitude must be a valid number between -180 and 180.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginUser(email, password);
        showSuccess('Operator connection authorized.');
      } else {
        const extra = {};
        if (role === 'BENEFICIARY') {
          extra.phone = phone.trim();
          extra.location_lat = parseFloat(locationLat);
          extra.location_lng = parseFloat(locationLng);
          extra.location_name = locationName.trim();
        }
        await registerUser(name, email, password, role, extra);
        showSuccess('Profile successfully registered and session initialized.');
      }
      navigate('/dashboard');
    } catch (err) {
      showError(err.message || 'Authentication failed. Please verify fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (newMode) => {
    setSearchParams({ mode: newMode });
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-brand-bg relative overflow-y-auto">
      {/* Decorative Warm Accents */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-indigo/10 blur-3xl glow-indigo" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-brand-cyan/15 blur-3xl glow-violet" />
      </div>

      <div className="w-full max-w-lg z-10 my-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo mb-3 shadow-sm">
            <Shield size={32} className="text-[#607D6C] animate-pulse" />
          </div>
          <h1 className="font-outfit text-3xl font-extrabold tracking-wide text-[#2C3531]">
            RESQCOMMAND
          </h1>
          <p className="text-xs font-bold text-[#D4A373] uppercase tracking-widest mt-1.5 text-center">
            Disaster Response & NGO Resource Platform
          </p>
        </div>

        {/* Panel Form */}
        <div className="bg-[#FFFFFF] p-8 rounded-2xl border border-brand-border shadow-lg relative">
          {/* Header tabs */}
          <div className="flex border-b border-brand-border mb-6">
            <button
              onClick={() => toggleMode('login')}
              type="button"
              className={`flex-1 pb-3.5 text-center text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'text-[#607D6C] border-b-2 border-[#607D6C]'
                  : 'text-brand-text-muted hover:text-[#2C3531]'
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => toggleMode('register')}
              type="button"
              className={`flex-1 pb-3.5 text-center text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'text-[#607D6C] border-b-2 border-[#607D6C]'
                  : 'text-brand-text-muted hover:text-[#2C3531]'
              }`}
            >
              CREATE AN ACCOUNT
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'login' ? (
              // Login Mode
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@organization.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-medium glass-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
                      <Key size={16} />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="w-full pl-10 pr-4 py-2.5 text-sm font-medium glass-input"
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Onboarding Registration Form
              <div className="space-y-6">
                
                {/* SECTION 1: ACCOUNT INFORMATION */}
                <div className="space-y-4 pt-1">
                  <h3 className="text-[11px] font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5">
                    1. Account Information
                  </h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="Enter full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium glass-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
                        <Mail size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        placeholder="name@organization.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium glass-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
                        <Key size={16} />
                      </span>
                      <input
                        type="password"
                        required
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-2.5 text-sm font-medium glass-input"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ROLE */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5">
                    2. Role Definition
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole('BENEFICIARY')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        role === 'BENEFICIARY'
                          ? 'border-[#607D6C] bg-[#607D6C]/5 text-[#607D6C] font-semibold'
                          : 'border-brand-border text-brand-text-secondary hover:bg-brand-bg/50'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wider">Beneficiary</span>
                      <span className="text-[9px] opacity-70 mt-1">Need Relief Support</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setRole('VOLUNTEER')}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        role === 'VOLUNTEER'
                          ? 'border-[#607D6C] bg-[#607D6C]/5 text-[#607D6C] font-semibold'
                          : 'border-brand-border text-brand-text-secondary hover:bg-brand-bg/50'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wider">Volunteer</span>
                      <span className="text-[9px] opacity-70 mt-1">Offer Assistance</span>
                    </button>
                  </div>
                </div>

                {/* BENEFICIARY SPECIFIC ONBOARDING FIELDS */}
                {role === 'BENEFICIARY' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* SECTION 3: CONTACT INFO */}
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5">
                        3. Contact Information
                      </h3>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                          Phone Number
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
                            <Phone size={16} />
                          </span>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. +91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={loading}
                            className="w-full pl-10 pr-4 py-2.5 text-sm font-medium glass-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 4: LOCATION */}
                    <div className="space-y-3">
                      <h3 className="text-[11px] font-bold text-[#D4A373] uppercase tracking-widest border-b border-brand-border pb-1.5">
                        4. Location Setup
                      </h3>

                      <div className="space-y-3.5">
                        {/* Detection Button */}
                        <div>
                          <button
                            type="button"
                            onClick={handleDetectLocation}
                            disabled={locationStatus === 'detecting' || loading}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#607D6C]/10 border border-[#607D6C]/30 text-[#607D6C] hover:bg-[#607D6C]/15 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                          >
                            <Compass size={14} className={locationStatus === 'detecting' ? 'animate-spin' : ''} />
                            Use my current location
                          </button>
                        </div>

                        {/* Location detection indicator status */}
                        {locationStatus === 'success' && (
                          <div className="flex items-center gap-2 text-xs text-[#607D6C] font-semibold bg-[#607D6C]/10 p-2.5 rounded-lg border border-[#607D6C]/25">
                            <Check size={16} className="flex-shrink-0" />
                            <span>✓ Location detected</span>
                          </div>
                        )}

                        {locationStatus === 'denied' && (
                          <div className="flex items-start gap-2 text-xs text-[#C26D5C] bg-[#C26D5C]/10 p-2.5 rounded-lg border border-[#C26D5C]/25">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>Location access was denied. Please enter your location manually.</span>
                          </div>
                        )}

                        {/* Location Name Input */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-[#2C3531] uppercase tracking-wider block">
                            Location Name
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-text-muted">
                              <MapPin size={16} />
                            </span>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Hyderabad, Telangana"
                              value={locationName}
                              onChange={(e) => setLocationName(e.target.value)}
                              disabled={loading}
                              className="w-full pl-10 pr-4 py-2.5 text-sm font-medium glass-input"
                            />
                          </div>
                        </div>

                        {/* Secondary Lat/Lng info or Fallback Manual Input */}
                        {locationStatus === 'denied' || locationStatus === 'idle' && !locationLat ? (
                          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-brand-bg border border-brand-border">
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                                Latitude
                              </label>
                              <input
                                type="number"
                                step="any"
                                required={role === 'BENEFICIARY'}
                                placeholder="e.g. 17.4000"
                                value={locationLat}
                                onChange={(e) => setLocationLat(e.target.value)}
                                disabled={loading}
                                className="w-full px-2.5 py-1 text-xs glass-input"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-brand-text-secondary uppercase tracking-wider block">
                                Longitude
                              </label>
                              <input
                                type="number"
                                step="any"
                                required={role === 'BENEFICIARY'}
                                placeholder="e.g. 78.5000"
                                value={locationLng}
                                onChange={(e) => setLocationLng(e.target.value)}
                                disabled={loading}
                                className="w-full px-2.5 py-1 text-xs glass-input"
                              />
                            </div>
                          </div>
                        ) : (
                          // Secondary display only
                          (locationLat || locationLng) && (
                            <div className="text-[10px] text-brand-text-secondary font-mono flex gap-4 pl-1">
                              <span>Latitude: <strong className="text-brand-text-primary">{locationLat || '—'}</strong></span>
                              <span>Longitude: <strong className="text-brand-text-primary">{locationLng || '—'}</strong></span>
                            </div>
                          )
                        )}

                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-xs font-bold tracking-widest uppercase rounded-lg bg-[#607D6C] hover:bg-[#607D6C]/95 hover:shadow-md disabled:bg-brand-bg disabled:border-brand-border disabled:text-brand-text-muted text-[#FFFFFF] shadow transition-all duration-200 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Establish Secure Connection' : 'Register Operator'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[10px] text-brand-text-muted uppercase tracking-widest">
          SECURE INTERFACE • TLS ENCRYPTED • RESQCOMMAND OPERATIONS CENTER
        </div>
      </div>
    </div>
  );
}
