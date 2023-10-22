import Skeleton from "react-loading-skeleton";

interface SkeletonContainerProps<T> {
  data: T | undefined;
  loading?: boolean;
  loadedComponent: React.FC<{ data: T }>;
}
const SkeletonContainer = <T,>({
  data,
  loading,
  loadedComponent,
}: SkeletonContainerProps<T>) => {
  if (data && !loading) {
    return loadedComponent({ data });
  } else {
    return <Skeleton height={100} />;
  }
};

export default SkeletonContainer;
