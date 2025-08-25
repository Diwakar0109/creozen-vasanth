// src/components/common/PrescriptionStatusBadge.tsx
import { Pill, CheckCircle, Hourglass, XCircle } from 'lucide-react';
import { PrescriptionRecordStatus } from '../../types';

interface Props {
  status: PrescriptionRecordStatus;
}

const statusStyles: Record<PrescriptionRecordStatus, { text: string; icon: React.ElementType; className: string }> = {
  'Created': {
    text: 'Pharmacy: Pending',
    icon: Hourglass,
    className: 'bg-yellow-100 text-yellow-800',
  },
  'Partially Dispensed': {
    text: 'Pharmacy: Partial',
    icon: Pill,
    className: 'bg-blue-100 text-blue-800',
  },
  'Fully Dispensed': {
    text: 'Pharmacy: Dispensed',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800',
  },
  'Not Available': {
    text: 'Pharmacy: Not Available',
    icon: XCircle,
    className: 'bg-red-100 text-red-800',
  },
};

export default function PrescriptionStatusBadge({ status }: Props) {
  const style = statusStyles[status] || statusStyles['Created'];
  const Icon = style.icon;

  return (
    <div
      className={`inline-flex items-center space-x-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}
    >
      <Icon className="h-3 w-3" />
      <span>{style.text}</span>
    </div>
  );
}