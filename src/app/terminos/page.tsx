import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = { title: "Bases del sorteo | Duelo de Campeones" };

// PLANTILLA: completa los campos resaltados (<mark>) y revísala con asesoría legal antes de lanzar.
export default function TermsPage() {
  return (
    <LegalPage title="Bases del sorteo" updated="27 de septiembre de 2026">
      <h2>Organizadores</h2>
      <p>
        Machete Burger (<mark>[razón social y NIT]</mark>) y Coliseo (<mark>[razón social y NIT]</mark>).
      </p>

      <h2>Vigencia</h2>
      <p>
        Del <mark>[fecha de inicio]</mark> al <mark>[fecha de cierre]</mark>, en <mark>[ciudad]</mark>.
      </p>

      <h2>Quién puede participar</h2>
      <p>
        Personas mayores de 18 años, residentes en Colombia, con un número de celular colombiano propio.{" "}
        <mark>[Exclusiones, por ejemplo empleados de los restaurantes y sus familiares]</mark>.
      </p>

      <h2>Cómo participar</h2>
      <ol>
        <li>Escanea el código QR en Machete Burger o en Coliseo.</li>
        <li>Califica de 1 a 5 estrellas la hamburguesa o el chuzo desgranado que probaste, con tu nombre y celular.</li>
        <li>
          Para entrar al sorteo debes calificar al menos un plato en cada restaurante. Todos los participantes tienen
          la misma probabilidad de ganar, sin importar cuántos platos califiquen.
        </li>
        <li>Registra un celular válido y activo: es el único medio por el que contactaremos a los ganadores.</li>
      </ol>

      <h2>Premio</h2>
      <p>
        Un mes de hamburguesas gratis para 8 ganadores: 4 lo redimen en Machete Burger y 4 en Coliseo. Cada ganador
        recibe 1 hamburguesa o 1 chuzo al día durante <mark>[fechas o plazo del mes de premio]</mark>, en el
        restaurante que le corresponda. El premio no es acumulable (el día que no se redime se pierde), es personal,
        intransferible y no se puede cambiar por dinero.
      </p>

      <h2>Sorteo y entrega</h2>
      <p>
        El sorteo se realizará el <mark>[fecha]</mark> con un sistema de selección aleatoria entre todos los
        participantes habilitados. Primero se eligen los ganadores de un restaurante y luego los del otro; una misma
        persona no puede ganar dos veces. Contactaremos a cada ganador al celular registrado. Si el número no es real,
        no corresponde a quien se registró o no responde en <mark>[48 horas]</mark>, se sorteará un reemplazo.
      </p>

      <h2>El campeón del duelo</h2>
      <p>
        El restaurante campeón se define por el promedio de estrellas de sus platos. Los resultados se publican al
        cierre del concurso.
      </p>

      <h2>Participaciones inválidas</h2>
      <p>
        Los organizadores pueden anular participaciones con datos falsos, con varios números para una misma persona o
        hechas con medios automatizados.
      </p>

      <h2>Autorización</h2>
      <p>
        <mark>[Número de autorización de Coljuegos o de la entidad competente, si aplica]</mark>.
      </p>

      <h2>Datos personales</h2>
      <p>
        Tratamos tus datos según nuestra <Link href="/privacidad">política de tratamiento de datos</Link>.
      </p>
    </LegalPage>
  );
}
