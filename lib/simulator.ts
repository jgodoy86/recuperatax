// Simulador de recuperación de IVA
import { FEE_MIN, FEE_PCT, IVA_RATE } from "./constants";
import {
  EligibilityInput,
  EligibilityResult,
  evaluateEligibility,
} from "./eligibility";

export type SimulationInput = EligibilityInput & {
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  email?: string;
};

export type SimulationResult = {
  eligibility: EligibilityResult;
  ivaPaid: number;
  estimatedRefund: number;
  fees: number;
  netBenefit: number;
  estimatedMonths: { min: number; max: number };
  risks: string[];
  requiredDocuments: string[];
  recommendedPlan: string;
};

export function simulate(input: SimulationInput): SimulationResult {
  // Si no reportó IVA, estimarlo a partir del valor de compra
  const ivaPaid =
    input.ivaPaid > 0
      ? input.ivaPaid
      : Math.round((input.purchaseValue / (1 + IVA_RATE)) * IVA_RATE);

  const eligibility = evaluateEligibility({ ...input, ivaPaid });

  const estimatedRefund = eligibility.verdict === "NO_APTO" ? 0 : ivaPaid;
  const fees =
    estimatedRefund > 0
      ? Math.max(Math.round(estimatedRefund * FEE_PCT), FEE_MIN)
      : 0;
  const netBenefit = Math.max(estimatedRefund - fees, 0);

  const risks: string[] = [];
  if (!input.ivaDiscriminated)
    risks.push("Si la factura no discrimina el IVA, la DIAN puede rechazar la solicitud.");
  if (input.clientType === "EMPRESA")
    risks.push("Empresas requieren certificación de contador o revisor fiscal.");
  if (eligibility.verdict === "REVISION")
    risks.push("El caso tiene puntos pendientes de verificación documental.");
  risks.push("Los tiempos de UPME y DIAN pueden variar según requerimientos de las entidades.");

  const requiredDocuments = [
    input.clientType === "EMPRESA" ? "RUT y cámara de comercio" : "Cédula y RUT",
    "Factura electrónica con IVA discriminado (PDF y XML)",
    "Ficha técnica del vehículo",
    "Soporte de pago",
    ...(input.clientType === "EMPRESA"
      ? ["Certificación contable del IVA no descontado"]
      : []),
  ];

  return {
    eligibility,
    ivaPaid,
    estimatedRefund,
    fees,
    netBenefit,
    estimatedMonths: { min: 4, max: 8 },
    risks,
    requiredDocuments,
    recommendedPlan:
      input.clientType === "EMPRESA" ? "Plan Empresas y Flotas" : "Plan Personas",
  };
}
