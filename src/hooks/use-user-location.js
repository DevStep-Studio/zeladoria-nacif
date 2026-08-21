import {useCallback, useEffect, useRef, useState} from 'react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {
 GEOLOCATION_TIMEOUT_MS,
 LOW_ACCURACY_THRESHOLD_METERS,
 getProfileLocation,
 loadStoredLocation,
 locationToUserPayload,
 resolveManualLocation,
 reverseGeocode,
 saveStoredLocation,
} from '@/lib/location';

function getGeolocationError(error) {
 if (!error) return 'Não foi possível identificar sua localização. Informe seu CEP.';
 if (error.code === 1) return 'Permita o acesso à localização para visualizar informações da sua região.';
 if (error.code === 2) return 'GPS indisponível no momento. Informe seu CEP.';
 if (error.code === 3) return 'A localização demorou para responder. Informe seu CEP.';
 return 'Não foi possível identificar sua localização. Informe seu CEP.';
}

function readBrowserPosition() {
 return new Promise((resolve, reject) => {
  if (!navigator.geolocation) {
   reject(new Error('Navegador incompatível com localização automática.'));
   return;
  }

  navigator.geolocation.getCurrentPosition(resolve, reject, {
   enableHighAccuracy: true,
   timeout: GEOLOCATION_TIMEOUT_MS,
   maximumAge: 5 * 60 * 1000,
  });
 });
}

export function useUserLocation({autoRequest = false, persistToProfile = true} = {}) {
 const {user} = useAuth();
 const [location, setLocation] = useState(null);
 const [status, setStatus] = useState('idle');
 const [message, setMessage] = useState('');
 const [error, setError] = useState(null);
 const [warning, setWarning] = useState(null);
 const initializedRef = useRef(false);

 const saveLocation = useCallback(async (nextLocation) => {
  saveStoredLocation(nextLocation);
  setLocation(nextLocation);

  if (persistToProfile && user?.email) {
   try {
    await base44.auth.updateMe(locationToUserPayload(nextLocation));
   } catch (persistError) {
    console.error('Failed to persist user location', persistError);
   }
  }
 }, [persistToProfile, user?.email]);

 const requestLocation = useCallback(async ({force = false} = {}) => {
  const saved = getProfileLocation(user) || loadStoredLocation();
  if (!force && saved) {
   setLocation(saved);
   setStatus('success');
   setMessage('Usando sua última localização válida.');
   setError(null);
   setWarning(saved.lowAccuracy ? 'A última localização salva possui baixa precisão.' : null);
   return saved;
  }

  if (!navigator.geolocation) {
   const nextMessage = 'Navegador incompatível com localização automática.';
   setStatus('error');
   setError(nextMessage);
   setMessage('Não foi possível identificar sua localização. Informe seu CEP.');
   return null;
  }

  setStatus('loading');
  setMessage('Atualizando dados da sua região...');
  setError(null);
  setWarning(null);

  try {
   const position = await readBrowserPosition();
   const {latitude, longitude, accuracy} = position.coords;
   const lowAccuracy = Number(accuracy) > LOW_ACCURACY_THRESHOLD_METERS;

   let nextLocation;
   try {
    nextLocation = await reverseGeocode(latitude, longitude, {
     accuracy,
     source: 'device',
     lowAccuracy,
    });
   } catch (geocodeError) {
    console.error('Reverse geocoding failed', geocodeError);
    nextLocation = {
     latitude,
     longitude,
     accuracy,
     address: '',
     neighborhood: '',
     city: '',
     state: '',
     postalCode: '',
     source: 'device',
     updatedAt: new Date().toISOString(),
     lowAccuracy,
    };
    setWarning('Localização obtida, mas não foi possível identificar o endereço aproximado.');
   }

   await saveLocation(nextLocation);
   setStatus('success');
   setMessage(lowAccuracy ? 'Localização identificada com baixa precisão.' : 'Localização atualizada.');
   setWarning(lowAccuracy ? 'O GPS retornou baixa precisão. Revise cidade e estado antes de usar os dados.' : null);
   return nextLocation;
  } catch (positionError) {
   const nextMessage = getGeolocationError(positionError);
   setStatus('error');
   setError(nextMessage);
   setMessage(nextMessage);
   return null;
  }
 }, [saveLocation, user]);

 const setManualLocation = useCallback(async (manualData) => {
  setStatus('loading');
  setMessage('Atualizando dados da sua região...');
  setError(null);
  setWarning(null);

  try {
   const nextLocation = await resolveManualLocation(manualData);
   await saveLocation(nextLocation);
   setStatus('success');
   setMessage('Localização manual salva.');
   return nextLocation;
  } catch (manualError) {
   const nextMessage = manualError?.message || 'Não foi possível localizar os dados informados.';
   setStatus('error');
   setError(nextMessage);
   setMessage(nextMessage);
   return null;
  }
 }, [saveLocation]);

  useEffect(() => {
   const initLocation = async () => {
    // 1. First priority: user's registered home address from profile/cadastro
    const registered = getProfileLocation(user);
    if (registered) {
     initializedRef.current = true;
     setLocation(registered);
     setStatus('success');
     setMessage('Usando seu endereço residencial cadastrado.');
     return;
    }

    // Try resolving from text address if lat/lon not stored yet
    if (user?.street || user?.postal_code || (user?.city && user?.state)) {
      try {
        const resolved = await resolveManualLocation({
          postalCode: user.postal_code || '',
          street: user.street || '',
          neighborhood: user.neighborhood || '',
          city: user.city || '',
          state: user.state || '',
        });
        if (resolved) {
          initializedRef.current = true;
          setLocation(resolved);
          setStatus('success');
          setMessage('Usando seu endereço residencial cadastrado.');
          return;
        }
      } catch {}
    }

    const saved = loadStoredLocation();
    if (saved) {
     initializedRef.current = true;
     setLocation(saved);
     setStatus('success');
     setMessage('Usando sua localização recente.');
     setWarning(saved.lowAccuracy ? 'A última localização salva possui baixa precisão.' : null);
     return;
    }

    if (autoRequest) {
     initializedRef.current = true;
     requestLocation({force: true});
     return;
    }

    initializedRef.current = true;
   };

   initLocation();
  }, [autoRequest, requestLocation, user]);

 return {
  location,
  status,
  message,
  error,
  warning,
  isLoading: status === 'loading',
  requestLocation,
  setManualLocation,
 };
}
