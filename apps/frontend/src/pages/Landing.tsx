import { Link } from "react-router-dom";
import { DottedLines } from "@/components/DottedLines";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/grid/Grid";
import { GridCell } from "@/components/grid/GridCell";

const FEATURES = [
    {
        title: "Works with any provider",
        description: "Integrate with any CI provider for speed at all scales",
        illustration: "",
    },
    {
        title: "Remote Caching",
        description: "Never do the same work twice",
        illustration: "",
    },
    {
        title: "Effortless monorepos",
        description: "Easily define your workflows for local development and CI",
        illustration: "",
    },
];

export default function HomePage() {
    return (
        <>
            <div className="min-h-screen bg-linear-to-br from-teal-50 via-white to-blue-50 py-6 pt-24 max-w-6xl px-3 sm:px-6 md:py-12 md:pt-28 lg:px-12 mx-auto">
            <Grid
                columns={{
                    sm: 1,
                    md: 2,
                }}
                className="relative border-2 border-teal-200 rounded-lg shadow-lg bg-white"
            >
                <div className="absolute -top-1">
                    <div className="border-t-2 absolute w-[20px] h-[20px] -left-7 top-0.5 md:w-[32px] md:h-[32px] md:-left-4 md:top-0.5 border-teal-300" />
                    <div className="border-l-2 absolute w-[20px] h-[20px] -top-2 -left-0.5 md:w-[32px] md:h-[32px] md:-top-4 md:-left-0.5 border-teal-300" />
                </div>
                <GridCell className="relative border-b border-teal-100 col-span-2 px-6 py-12 xs:px-6 xs:py-12 md:p-16">
                    <DottedLines className="absolute top-0 bottom-0 left-0 right-0 overflow-hidden text-center flex items-center justify-center" />
                    <div className="relative z-1 flex flex-col justify-center">
                        <h1 className="mb-4 text-6xl font-semibold tracking-tighter text-center md:text-7xl text-gray-800">
                            {/* Make ship happen */}
                                Plug AI into own data
                        </h1>
                        <p className="max-w-[380px] m-auto mb-4 font-normal text-center text-gray-700 text-lg md:text-xl">
                                Flexible AI workflow automation for technical teams
                        </p>
                        <div className="w-full flex flex-wrap h-fit gap-3 2xs:gap-2 sm:gap-4 justify-center items-center">
                            <Button asChild className="text-sm sm:h-12 sm:text-base bg-teal-600 hover:bg-teal-700 text-white">
                                <Link to="/dashboard">Get started</Link>
                            </Button>
                        </div>
                    </div>
                </GridCell>
                <GridCell className="border-0 h-fit col-span-2 px-6 py-14 xs:px-6 xs:py-10 md:px-9 lg:px-12">
                    <h2 className="mb-1 text-[32px] font-semibold tracking-tighter text-gray-800">
                        Scale your workflows
                    </h2>
                    <p className="max-w-prose text-balance text-gray-700 text-base">
                        Optimize your local and CI tasks to save years of engineering time
                        and compute.
                    </p>
                    <div className="my-8 grid h-fit gap-y-12 md:grid-cols-3 md:gap-x-8">
                        {FEATURES.map((feature) => (
                            <div key={feature.title} className="w-full">
                                {feature.illustration}
                                <h3 className="mt-2 text-2xl font-semibold tracking-tighter text-gray-800">
                                    {feature.title}
                                </h3>
                                <p className="mt-1.5 text-gray-700 text-base md:mt-2 text-pretty">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </GridCell>
            </Grid>
        </div>
        </>
    );
}