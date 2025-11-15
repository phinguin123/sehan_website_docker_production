import { React, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Ranking({ studentData }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!studentData || studentData.length === 0) {
    return (
      <div className="relative overflow-hidden flex-grow">
        <div className="text-6xl font-bold absolute inset-0 flex items-center justify-center">
          No Data
        </div>
      </div>
    );
  }

  console.log("received student ranking data", studentData);
  const getColor = (percentile) => {
    if (percentile >= 90) return "text-green-300";
    if (percentile >= 70) return "text-indigo-300";
    if (percentile >= 50) return "text-yellow-100";
    return "text-red-300";
  };

  const getRankingText = (percentile) => {
    if (percentile >= 90) return "10%";
    if (percentile >= 70) return "30%";
    if (percentile >= 50) return "50%";
    return "50%";
  };

  const getTopOrBelow = (percentile) => {
    if (percentile >= 50) return "Top";
    return "Below";
  };

  const getOpacity = (percentile) => {
    return (percentile / 100).toFixed(2);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? studentData.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === studentData.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <>
      <div className="relative overflow-hidden flex-grow" style={{height: "100%", width: "100%"}}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <motion.p
              className={`font-semibold text-2xl mb-4 ${getColor(
                studentData[currentIndex].percentile
              )}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring" }}
              style={{ textShadow: "0px 0px 6px #ffffff3b"}}
            >
              {studentData[currentIndex].subject_name}
            </motion.p>
            <motion.p
              className={`text-5xl font-bold ${getColor(
                studentData[currentIndex].percentile
              )}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring" }}
              style={{ textShadow: "0px 0px 6px #ffffff3b" }}
            >
              {getTopOrBelow(studentData[currentIndex].percentile)}
            </motion.p>
            <motion.div
              className="relative h-24 overflow-hidden"
              style={{ width: "100%" }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={studentData[currentIndex].percentile}
                  className={`text-6xl font-bold absolute inset-0 flex items-center justify-center ${getColor(
                    studentData[currentIndex].percentile
                  )}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    type: "spring",
                  }}
                  style={{ textShadow: "0px 0px 6px #ffffff3b" }}
                >
                  {getRankingText(studentData[currentIndex].percentile)}
                </motion.span>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex justify-between mt-4">
        <Button variant="outline" size="icon" style={{color: "black"}} onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous subject</span>
        </Button>
        <Button variant="outline" size="icon" style={{color: "black"}} onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next subject</span>
        </Button>
      </div>
    </>
  );
}

export default Ranking;
