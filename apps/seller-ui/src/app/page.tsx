import { ProtectedServerComponent } from '@/utils/protectedComponent';

export default function MainPage() {
  return (
    <ProtectedServerComponent
      Component={({ user }) => {
        user = user!;
        return (
          <div>
            the user
            {JSON.stringify(user, null, 2)}
          </div>
        );
      }}
    />
  );
}
