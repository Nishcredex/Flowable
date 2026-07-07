import React from 'react';

interface AdminPlaceholderProps {
  title: string;
}

const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title }) => {
  return (
    <div className="card">
      <div className="card-body text-muted">
        {title} configuration would appear here.
      </div>
    </div>
  );
};

export default AdminPlaceholder;