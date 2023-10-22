import Skeleton, { SkeletonProps } from "react-loading-skeleton";

interface SkeletonContainerProps<T> {
  data: T | undefined;
  loading?: boolean;
  loadedComponent: React.FC<{ data: T }>;
  skeletonProps?: SkeletonProps;
}
const SkeletonContainer = <T,>({
  data,
  loading,
  loadedComponent,
  skeletonProps,
}: SkeletonContainerProps<T>) => {
  if (data && !loading) {
    return loadedComponent({ data });
  } else {
    return <Skeleton {...skeletonProps} className="mb-4" />;
  }
};

export default SkeletonContainer;
