import React, {useRef} from 'react';
import {Camera, X, ImagePlus} from 'lucide-react';
import {Button} from"@/components/ui/button";
import {base44} from '@/api/base44Client';

export default function PhotoUploader({photos, setPhotos, maxPhotos = 5}) {
 const fileInputRef = useRef(null);
 const cameraInputRef = useRef(null);

 const handleFileSelect = async (e) => {
 const files = Array.from(e.target.files);
 for (const file of files) {
 if (photos.length >= maxPhotos) break;
 const {file_url} = await base44.integrations.Core.UploadFile({file});
 setPhotos(prev => [...prev, file_url]);
}
 e.target.value = '';
};

 const removePhoto = (index) => {
 setPhotos(prev => prev.filter((_, i) => i !== index));
};

 return (
 <div className="space-y-3">
 <div className="flex gap-2">
 <Button
 type="button" variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()}
 className="flex-1">
 <Camera className="w-4 h-4 mr-2" />
 Câmera
 </Button>
 <Button
 type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}
 className="flex-1">
 <ImagePlus className="w-4 h-4 mr-2" />
 Galeria
 </Button>
 </div>
 <input
 ref={cameraInputRef}
 type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect}
 />
 <input
 ref={fileInputRef}
 type="file" accept="image/*"multiple
 className="hidden" onChange={handleFileSelect}
 />
 {photos.length > 0 && (
 <div className="grid grid-cols-3 gap-2">
 {photos.map((url, i) => (
 <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
 <img src={url} alt="" className="w-full h-full object-cover" />
 <button
 type="button" onClick={() => removePhoto(i)}
 className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
 <X className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 )}
 <p className="text-xs text-muted-foreground">{photos.length}/{maxPhotos} fotos</p>
 </div>
 );
}