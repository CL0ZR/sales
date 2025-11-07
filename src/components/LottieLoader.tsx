"use client";

import React from "react";
import Lottie from "lottie-react";
import animationData from "../../public/Online-Shopping.json";

export default function LottieLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md px-4">
        {/* Lottie Animation */}
        <div className="mb-8">
          <Lottie
            animationData={animationData}
            loop={false}
            autoplay={true}
            style={{ width: "100%", height: "auto" }}
          />
        </div>

        {/* App Title */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            نظام إدارة المستودعات
          </h2>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    </div>
  );
}
