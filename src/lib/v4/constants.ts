export const PURPOSE_OF_INVESTIGATION = `The purpose of the investigation is to:
1. Determine the stability and integrity of structural members (i.e., column, beam, slab et cetera) of the existing building structure. See pictures in the Appendix (photographs of the building).
2. Determine the existing concrete strength of the building structure with respect to BS CODE 8110: Part 1 1997.
3. Provide engineering advice and/or remedial solutions to avert any accident/disaster.
4. Offer further actionable recommendation(s) based on the visual test conducted.`;

export const LITERATURE_REVIEW_BODY = `The Ultrasonic Pulse Velocity (UPV) testing is a widely utilized non-destructive testing (NDT) technique employed to evaluate the quality, uniformity, and integrity of concrete and other construction materials. The method operates by measuring the time taken for ultrasonic waves to travel through a material, providing insights into its density, elasticity, and potential internal defects.

The UPV test operates on the principle that the velocity of ultrasonic waves is directly influenced by the material's elastic properties and density. Higher velocities typically indicate denser and more homogenous materials, while lower velocities may signify cracks, voids, or other anomalies. Researchers such as Malhotra and Carino (2004) have extensively detailed the theoretical framework underpinning UPV testing, linking wave propagation characteristics to material properties.

UPV testing has broad applications in the construction and infrastructure sectors. Studies by Al-Amoudi et al. (2007) have demonstrated its efficacy in assessing the compressive strength of concrete, identifying regions of potential structural weakness. Moreover, UPV has been employed to monitor the progression of micro cracks and assess the impact of environmental factors, such as freeze-thaw cycles and chloride ingress (Neville, 2011). Emerging research highlights its application in 3D printing technologies and sustainable materials, enabling rapid quality assessments (Zhang et al., 2020).

Various international standards govern the determination of ultrasonic pulse velocity in concrete, ensuring consistency and reliability in testing procedures. The most widely recognized standard is ASTM C597 "Standard Test Method for Pulse Velocity Through Concrete," which outlines the methodology for conducting UPV tests, including equipment requirements, specimen preparation, and data interpretation. Another significant standard is BS EN 12504-4:2004, which provides guidelines for assessing the uniformity and estimating the strength of concrete using ultrasonic pulse velocity. These standards emphasize the importance of proper calibration, surface preparation, and consistent testing conditions to obtain accurate results.

References
Malhotra, V. M., & Carino, N. J. (2004). Handbook on Nondestructive Testing of Concrete. CRC Press.
Al-Amoudi, O. S. B., Maslehuddin, M., & Shameem, M. (2007). Role of UPV in assessing concrete quality. Cement and Concrete Research, 37(6), 995-1003.
Neville, A. M. (2011). Properties of Concrete. Pearson Education Limited.
ASTM C597-16. Standard Test Method for Pulse Velocity Through Concrete. ASTM International.
BS EN 12504-4:2004. Testing Concrete – Part 4: Determination of Ultrasonic Pulse Velocity. British Standards Institution.
Zhang, H., Liu, Q., & Xu, Y. (2020). Application of UPV in 3D printed concrete. Materials and Structures, 53(4), 1-12.`;

export const METHODOLOGY_SECTION = `NON-DESTRUCTIVE CONCRETE STRENGTH AND REBAR DETERMINATION.

This test is determined by using the Portable Ultrasonic Non-Destructive Digital Indicating Tester (PUNDIT) and Profoscope. Non-Destructive, as the name implies means that the materials being tested are not damaged during the test.

In the Non-Destructive Test, some properties of concrete and Rebar (the reinforcing steel used as rod in concrete to give additional strength) were measured. These were used to estimate the strength of the concrete, its elastic behavior and durability, hence determining the integrity of the structural member.

CONCRETE
Pulse velocity measurements made on concrete structures are used for quality control purposes. In comparison with mechanical tests on control samples such as cubes or cylinders, pulse velocity measurements have the advantage that they relate directly to the concrete in the structure rather than to samples, which may not be always truly representative of the concrete in situ.

A pulse of longitudinal vibrations is produced by an electro-acoustical transducer, which is held in contact with one surface of the concrete under test. When the pulse generated is transmitted into concrete from the transducer using a certified coupling gel material such as (couplant or cellulose paste) it undergoes multiple reflections as the boundaries of the different materials phases within the concrete.

A complex system of stress waves develops, which includes both longitudinal and shear waves, and propagates through the concrete. The first waves to reach the receiving transducer are the longitudinal waves, which are converted into an electrical signal by a second transducer.

Electronic timing circuits enable the transit time (T) of the pulse to be measured. This test is conducted to assess the quality & integrity of concrete by passing ultrasound waves through the specimen under test.

The Pundit test equipment can also determine the followings:
- The homogeneity of the concrete,
- The presence of cracks, voids and other imperfections,
- Changes in the structure of the concrete which may occur with time,
- The quality of the concrete in relation to standard requirements,
- The quality of one element of concrete in relation to another, and
- The values of dynamic elastic modulus of the concrete`;

export const REBAR_ASSESSMENT_BODY = `During testing, Profoscope was used to check the depth from the face of the concrete to the top of the reinforcing steel (concrete cover), locate the Rebar's exact position within the structural member and the Rebar diameter estimated.

In addition, the essence of using the Profoscope was to check for the following:
If the configuration of the Rebar conforms to necessary design and construction standards,
To deduce if the Rebar was placed correctly during casting, which determines the integrity of the structural members.

NOTE: That this assessment does not cover the reinforcement design strength as we are not consulted before casting.`;

export const SYSTEM_PROMPT = `You are an expert NDT (Non-Destructive Testing) structural integrity report writer for SKAAP CONSULT, an LSMTL-accredited laboratory in Lagos, Nigeria (LSMTL/2020/LAB-REG/D/003).

You write sections of formal engineering reports following LSMTL guidelines.

WRITING RULES:
- Use formal engineering language at all times
- Never use casual or conversational language
- All concrete strength units: N/mm² (with superscript 2) or N/MM2 in text
- All measurements in SI units
- Client names always in full as provided
- Addresses always verbatim as provided
- Dates in format: "6th of March 2026" or "6TH MAY, 2026"
- Building state: use "ongoing construction" or "existing building" as appropriate
- Never invent structural details not in the provided data
- Never fabricate test results or observations
- If visual inspection data is not provided, leave explicit placeholder`;
