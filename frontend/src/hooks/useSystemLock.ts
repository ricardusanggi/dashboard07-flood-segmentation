//path  :   
import { useTrainingLock } from "../components/context/TrainingLockContext";

type DisabledProps = {
  disabled?: boolean;
  title?: string;
};

export function useSystemLock(): {
  locked: boolean;
  disabledProps: DisabledProps;
} {
  const { locked } = useTrainingLock();

  return {
    locked,
    disabledProps: locked ? { disabled: true, title: "Training in progress" } : {}
  };
}
