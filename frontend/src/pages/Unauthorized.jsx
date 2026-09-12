import { Lock, Home, ArrowRight } from "lucide-react"


const Unauthorized = () => {
    return (
        <div className="flex-1 flex items-center justify-center px-6 py-16">

            <section className="w-full max-w-2xl text-center">

                {/* Lock icon  */}
                <div className="mx-auto mb-8 flex items-center justify-center
                        w-24 h-24 rounded-full bg-blue-50">

                    <Lock />
                </div>


                {/* Error code  */}
                <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-3">
                    Erreur 403
                </p>


                {/* Title */}
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-5">
                    Accès non autorisé
                </h1>


                {/* Description */}
                <p className="text-muted text-base md:text-lg leading-relaxed
                      max-w-xl mx-auto mb-10">
                    Désolé, vous n'avez pas les autorisations nécessaires pour
                    accéder à cette page.
                    Connectez-vous avec un compte disposant des droits requis
                    ou retournez à l'accueil.
                </p>


                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">

                    {/* Go to HomePage */}
                    <a href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center
                          gap-2 bg-white hover:bg-gray-50
                          text-primary font-semibold
                          border border-gray-200
                          px-7 py-3.5 rounded-md
                          transition-all duration-200">

                        {/* Home icon */}
                        <Home />

                        Retour à l'accueil
                    </a>

                    {/* Go to login */}
                    <a href="/connexion"
                        className="w-full sm:w-auto inline-flex items-center justify-center
                          gap-2 bg-white hover:bg-gray-50
                          text-primary font-semibold
                          border border-gray-200
                          px-7 py-3.5 rounded-md
                          transition-all duration-200">

                        Se connecter

                        {/* icon */}
                        <ArrowRight />

                    </a>

                </div>

            </section>

        </div>
    )
}

export default Unauthorized
