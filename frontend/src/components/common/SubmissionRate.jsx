// SubmissionRate.js
import { useEffect, useState, React } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
// import { Progress } from "@/components/ui/progress"
// import * as Progress from '@radix-ui/react-progress';

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  // margin-top: 20%;
  width: 70%;
  height: 100%;
  text-align: center;
  border-color: ${(props) =>
    props.rate >= 50
      ? "#28a745"
      : "#dc3545"}; /* Green if >= 50%, Red otherwise */
  border-radius: 36000px;
`;

const Percentage = styled.div`
  font-size: 6rem;
  font-weight: bold;
  color: ${(props) =>
    props.rate >= 50
      ? "#28a745"
      : "#dc3545"}; /* Green if >= 50%, Red otherwise */
`;

const Label = styled.div`
  font-size: 1rem;
  color: #6c757d;
`;

function ColoredProgress({ value, className }) {
  const [width, setWidth] = useState(10);

  useEffect(() => {
    setWidth(value);
  }, [value]);

  let color = "bg-red-500";
  if (value >= 80) {
    color = "bg-green-500";
  } else if (value >= 60) {
    color = "bg-yellow-500";
  }

  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <motion.div
        className={`h-2.5 rounded-full ${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      ></motion.div>
    </div>
  );
}

// Component
const SubmissionRate = ({ submissionRate }) => {
  return (
    <Container $rate={submissionRate}>
      {/* <Percentage rate={submissionRate}>{submissionRate}%</Percentage> */}
      {/* <div className="text-center">
        <span className="text-4xl font-bold">{submissionRate}%</span>
      </div> */}
      <div className="text-center">
        <AnimatePresence>
          <motion.span
            className="text-4xl font-bold inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              duration: 0.7,
            }}
          >
            {submissionRate}%
          </motion.span>
        </AnimatePresence>
      </div>
      <ColoredProgress value={submissionRate} className="mt-4" />
    </Container>
  );
};

export default SubmissionRate;
