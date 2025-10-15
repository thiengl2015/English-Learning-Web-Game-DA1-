export function RobotMascot({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-cyan-400/30 blur-3xl rounded-full animate-pulse" />

      <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
        <div className="w-16 h-10 relative scale-[3.4]">
          <div
            className="w-12 h-10 left-[9.81px] top-0 absolute bg-white"
            style={{
              borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%",
            }}
          ></div>
          <div className="left-[43.36px] top-[1.42px] absolute">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11.1068 11.2404L12.9246 5.06748L8.46125 0.416016L2.18012 1.93487L0.362305 8.10773L4.82562 12.7592L11.1068 11.2404Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="left-[12.76px] top-[1.38px] absolute">
            <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.67432 12.8003L13.2434 8.25144L11.5699 2.04008L5.32747 0.375L0.755859 4.92384L2.42928 11.1352L8.67432 12.8003Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="left-0 top-[21.82px] absolute">
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M11.3068 11.0617C15.5621 6.8276 17.9816 2.37013 16.7109 1.1057C15.4401 -0.158727 10.9603 2.24869 6.70497 6.48283C2.44963 10.717 0.030159 15.1744 1.30092 16.4389C2.57168 17.7033 7.05147 15.2959 11.3068 11.0617Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="left-[49.18px] top-[15.45px] absolute">
            <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10.0186 10.9838C13.7203 6.26224 15.5724 1.543 14.1553 0.443082C12.7383 -0.656835 8.58874 2.27909 4.88706 7.00066C1.18538 11.7222 -0.666686 16.4415 0.750363 17.5414C2.16741 18.6413 6.31696 15.7054 10.0186 10.9838Z"
                fill="white"
              />
            </svg>
          </div>
          <div className="left-[18.24px] top-[7.56px] absolute">
            <svg width="33" height="19" viewBox="0 0 33 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M31.9502 12.6091C31.6769 14.4564 30.7383 15.7186 30.4444 16.0932C30.2123 16.3857 29.4955 17.2478 28.263 17.9533C27.621 18.3202 26.226 18.9975 24.434 18.9898C23.2299 18.9847 23.168 18.6563 20.3317 17.961C18.7124 17.5633 17.9028 17.3658 16.9023 17.3119C15.1309 17.217 13.6483 17.5325 12.8129 17.7147C11.4772 18.0072 11.3199 18.1945 9.97915 18.4459C9.10505 18.6101 8.12266 18.7974 7.06033 18.7255C5.40238 18.6152 3.15138 17.8481 1.67392 15.8982C0.588393 14.4692 0.379537 13.0068 0.302183 12.4218C-0.0175462 9.99476 0.933906 8.16034 1.21238 7.64209C1.74612 6.64919 2.34432 6.04627 3.1488 5.23297C4.52312 3.83728 5.83814 3.03424 6.40282 2.71354C8.12781 1.72578 9.60785 1.3435 10.5335 1.11003C13.1455 0.453234 15.2108 0.527633 17.4876 0.625126C19.669 0.717489 21.2702 0.786764 23.3485 1.46922C24.3334 1.79249 25.9115 2.32613 27.5823 3.63203C29.1165 4.83018 29.9648 6.08219 30.1788 6.40546C30.8879 7.48302 32.3757 9.73563 31.9502 12.6091Z"
                fill="#003C68"
              />
            </svg>
          </div>
          <div className="left-[39.04px] top-[13.49px] absolute">
            <svg width="5" height="8" viewBox="0 0 5 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.78976 3.91351C4.82387 2.07185 3.80121 0.55962 2.94016 0.535861C1.64454 0.512103 0.132007 1.98581 0.0978961 3.82748C0.0637852 5.66914 1.08644 7.18137 2.38206 7.20513C3.67769 7.22889 4.75565 5.75518 4.78976 3.91351Z"
                fill="#4FFCFA"
              />
            </svg>
          </div>
          <div className="left-[24.47px] top-[13.22px] absolute">
            <svg width="6" height="7" viewBox="0 0 6 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.22433 3.64496C5.25844 1.80329 4.23578 0.291065 2.94016 0.267307C1.64454 0.243548 0.566577 1.71725 0.532466 3.55892C0.498355 5.40059 1.52101 6.91281 2.81663 6.93657C4.11226 6.96033 5.19022 5.48663 5.22433 3.64496Z"
                fill="#4FFCFA"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
