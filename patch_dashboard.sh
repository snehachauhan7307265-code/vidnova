sed -i '/import { useAuth } from/a import { useSubscriberCount } from "../hooks/useSubscriberCount";' src/pages/Dashboard.tsx
sed -i '/const { currentUser, userProfile } = useAuth();/a \ \ const subscriberCount = useSubscriberCount(currentUser?.uid);' src/pages/Dashboard.tsx
sed -i 's/{userProfile?.subscribers || 0}/{subscriberCount}/' src/pages/Dashboard.tsx
