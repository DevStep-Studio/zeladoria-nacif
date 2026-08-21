import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from"@/components/ui/card";
import {BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend} from 'recharts';
import {CATEGORIES, PUBLIC_STATUS_OPTIONS} from '@/lib/constants';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

export default function DashboardCharts({occurrences}) {
 // By category
 const categoryData = Object.entries(CATEGORIES).map(([key, cat]) => ({
 name: cat.label,
 count: occurrences.filter(o => o.category === key).length,
})).filter(d => d.count > 0);

 // By status
 const statusData = PUBLIC_STATUS_OPTIONS.map(([key, cfg]) => ({
 name: cfg.label,
 count: occurrences.filter(o => o.status === key).length,
})).filter(item => item.count > 0);

 // By neighborhood
 const neighborhoodMap = {};
 occurrences.forEach(o => {
 const n = o.neighborhood || 'Não informado';
 neighborhoodMap[n] = (neighborhoodMap[n] || 0) + 1;
});
 const neighborhoodData = Object.entries(neighborhoodMap)
 .sort(([, a], [, b]) => b - a)
 .slice(0, 8)
 .map(([name, count]) => ({name, count}));

 return (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-base">Por Categoria</CardTitle>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={250}>
 <PieChart>
 <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name, count}) =>`${count}`}>
 {categoryData.map((_, i) => (
 <Cell key={i} fill={COLORS[i % COLORS.length]} />
 ))}
 </Pie>
 <Tooltip />
 <Legend wrapperStyle={{fontSize: '11px'}} />
 </PieChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 <Card className="border-0 shadow-sm">
 <CardHeader className="pb-2">
 <CardTitle className="text-base">Por Status</CardTitle>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={250}>
 <BarChart data={statusData}>
 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
 <XAxis dataKey="name" tick={{fontSize: 11}} />
 <YAxis tick={{fontSize: 11}} />
 <Tooltip />
 <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>

 <Card className="border-0 shadow-sm lg:col-span-2">
 <CardHeader className="pb-2">
 <CardTitle className="text-base">Por Bairro (Top 8)</CardTitle>
 </CardHeader>
 <CardContent>
 <ResponsiveContainer width="100%" height={250}>
 <BarChart data={neighborhoodData} layout="vertical">
 <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
 <XAxis type="number" tick={{fontSize: 11}} />
 <YAxis dataKey="name" type="category" tick={{fontSize: 11}} width={120} />
 <Tooltip />
 <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 6, 6, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </CardContent>
 </Card>
 </div>
 );
}
