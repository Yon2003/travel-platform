'use client';

import { X } from 'lucide-react';
import RouteMap from './RouteMap';

interface MapModalProps {
    isOpen: boolean;
    onClose: () => void;
    from: string;
    to: string;
    departureLocation?: string;
    arrivalLocation?: string;
    transportType?: 'train' | 'bus' | 'minibus';
}

export default function MapModal({
    isOpen,
    onClose,
    from,
    to,
    departureLocation,
    arrivalLocation,
    transportType,
}: MapModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {from} → {to}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Маршрут на пътуването</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <RouteMap
                        from={from}
                        to={to}
                        departureLocation={departureLocation}
                        arrivalLocation={arrivalLocation}
                        transportType={transportType}
                    />
                </div>
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex items-center justify-between text-sm">
                        <div>
                            <p className="text-gray-600">Тръгване от:</p>
                            <p className="font-semibold">{departureLocation || from}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-600">Пристигане в:</p>
                            <p className="font-semibold">{arrivalLocation || to}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}