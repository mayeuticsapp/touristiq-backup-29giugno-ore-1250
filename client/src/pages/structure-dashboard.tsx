import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Bed, Calendar, Users, Settings, CalendarCheck, Star } from "lucide-react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export default function StructureDashboard() {
  const params = useParams();
  const structureId = params.id;
  
  // Recupera dati specifici della struttura
  const { data: structureData, isLoading } = useQuery({
    queryKey: ['structure', structureId],
    queryFn: () => fetch(`/api/structure/${structureId}`).then(res => res.json()),
    enabled: !!structureId
  });

  const navigation = [
    { icon: <TrendingUp size={16} />, label: "Dashboard", href: "#" },
    { icon: <Bed size={16} />, label: "Camere", href: "#" },
    { icon: <Calendar size={16} />, label: "Prenotazioni", href: "#" },
    { icon: <Users size={16} />, label: "Ospiti", href: "#" },
    { icon: <Settings size={16} />, label: "Impostazioni", href: "#" },
  ];

  if (isLoading) {
    return <div className="p-8">Caricamento dati struttura...</div>;
  }

  return (
    <Layout
      title={structureData ? `Dashboard ${structureData.name}` : "Dashboard Struttura"}
      role="Gestione Struttura"
      iqCode={structureData?.iqCode}
      navigation={navigation}
      sidebarColor="bg-purple-600"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <Bed className="text-blue-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Camere Occupate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {structureData ? `${structureData.occupiedRooms}/${structureData.totalRooms}` : "Caricamento..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <CalendarCheck className="text-green-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Check-in Oggi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {structureData ? structureData.checkinToday : "Caricamento..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="text-yellow-600" size={20} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Rating Medio</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {structureData ? structureData.rating : "Caricamento..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prenotazioni Recenti</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ospite</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camera</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {structureData?.recentBookings?.map((booking, index) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{booking.guest}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Camera {booking.room}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.checkin} - {booking.checkout}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={booking.status === 'Attivo' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {booking.status}
                      </Badge>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">Caricamento prenotazioni...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
