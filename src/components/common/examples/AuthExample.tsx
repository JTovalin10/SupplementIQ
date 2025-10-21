// Example usage of the new CASL-based auth system

import { Can, useAuth } from '@/lib/contexts/AuthContext';

function ExampleComponent() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      {/* Simple authentication check */}
      {isAuthenticated && (
        <p>Welcome, {user?.username}!</p>
      )}

      {/* Role-based permissions using CASL */}
      <Can I="create" a="Product">
        <button>Add New Product</button>
      </Can>

      <Can I="moderate" a="all">
        <button>Moderate Content</button>
      </Can>

      <Can I="manage" a="User">
        <button>Manage Users</button>
      </Can>

      {/* Conditional rendering based on abilities */}
      <Can I="delete" a="Product">
        <button>Delete Product</button>
      </Can>

      {/* Using the hook for complex logic */}
      <Can I="read" a="all">
        {user?.role === 'admin' && (
          <div>Admin-only content</div>
        )}
      </Can>
    </div>
  );
}

export default ExampleComponent;
