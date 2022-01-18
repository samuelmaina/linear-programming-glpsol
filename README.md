# Linear-Programming

Code that generates system of linear equations and an objective function and puts them as strings in a linear programming(.lp) file. 
The generated .lp file is fed to the glpsol module which maximizes or minimizes the objective equation. The glpsol then writes the content to an output file.

The code then reads the solution content( such as the max/min values) from the output file.

The specification of the problem can be viewed from the pdf: 
[problem_specification](https://github.com/samuelmaina/Linear-Programming/files/7760577/programmingassignment_2135707576.pdf)

Glpsol can be downloaded from the link https://sourceforge.net/projects/glpsolve/
