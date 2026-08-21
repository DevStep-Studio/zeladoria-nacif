import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {Tabs, TabsContent, TabsList, TabsTrigger} from"@/components/ui/tabs";
import DoctorsList from '@/components/health/DoctorsList';
import AppointmentForm from '@/components/health/AppointmentForm';
import MyAppointments from '@/components/health/MyAppointments';

export default function HealthModule() {
 const [selectedDoctor, setSelectedDoctor] = useState(null);
 const [activeTab, setActiveTab] = useState('doctors');

 const handleBookDoctor = (doctor) => {
 setSelectedDoctor(doctor);
 setActiveTab('agendar');
};

 const handleAppointmentDone = () => {
 setSelectedDoctor(null);
 setActiveTab('historico');
};

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="w-full max-w-max-width mx-auto px-margin-mobile md:px-container-padding py-8 pb-32 md:pb-12">
        {/* Hero Section */}
        <section className="bg-rose-500 rounded-xl p-8 mb-8 relative overflow-hidden flex flex-col justify-center min-h-[160px] shadow-sm">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[200px]">favorite</span>
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-label-sm text-label-sm opacity-80">
              <Link to="/" className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </Link>
              <span>Início</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-bold">Saúde</span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div>
                <h1 className="text-white font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-1">Saúde Pública</h1>
                <p className="text-white font-body-sm text-body-sm opacity-90">Consultas e atendimentos municipais na rede de saúde.</p>
              </div>
              <Link to="/" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors text-white">
                <span className="material-symbols-outlined">home</span>
              </Link>
            </div>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex bg-surface-container-lowest rounded-xl p-1 mb-6 shadow-sm border border-surface-container-highest max-w-fit mx-auto md:mx-0 h-auto">
            <TabsTrigger value="doctors" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-high data-[state=active]:text-rose-600 text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-2 transition-colors data-[state=active]:shadow-none">
              <span className="material-symbols-outlined text-sm">favorite</span> Médicos
            </TabsTrigger>
            <TabsTrigger value="agendar" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-high data-[state=active]:text-rose-600 text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-2 transition-colors data-[state=active]:shadow-none">
              <span className="material-symbols-outlined text-sm">calendar_today</span> Agendar
            </TabsTrigger>
            <TabsTrigger value="historico" className="px-6 py-2 rounded-lg data-[state=active]:bg-surface-container-high data-[state=active]:text-rose-600 text-secondary hover:bg-surface-container-low font-label-md text-label-md flex items-center gap-2 transition-colors data-[state=active]:shadow-none">
              <span className="material-symbols-outlined text-sm">history</span> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctors">
            <DoctorsList onBook={handleBookDoctor} />
          </TabsContent>

          <TabsContent value="agendar">
            <AppointmentForm preSelectedDoctor={selectedDoctor} onDone={handleAppointmentDone} />
          </TabsContent>

          <TabsContent value="historico">
            <MyAppointments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
